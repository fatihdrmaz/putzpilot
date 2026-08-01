"use client";

// Aktif işler (mockup adım 7-10): tam adres, GPS'li Başla/Tamamla,
// kalan süre sayacı, müşteri notu, ev fotoğrafları ve müşteriyle mesajlaşma.
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "../lang-context";
import { Banner } from "@/components/ui";
import { ChatBox } from "@/components/chat-box";
import {
  IconMapPin,
  IconClock,
  IconLocate,
  IconCheckCircle,
  IconCamera,
} from "@/components/icons";

interface ActiveJob {
  id: string;
  status: "assigned" | "in_progress";
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  total_price: string;
  prepayment_amount: string;
  notes: string | null;
  photo_urls: string[];
  address: {
    street: string;
    house_number: string;
    apartment: string | null;
    floor: string | null;
    postal_code: string;
    city: string;
  } | null;
}

// Kalan süre sayacı (mockup adım 9: "Kalan Süre 03:45:20")
function Countdown({ startedAt, durationHours, label }: { startedAt: string; durationHours: number; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(
    0,
    new Date(startedAt).getTime() + durationHours * 3_600_000 - now
  );
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="rounded-xl bg-ink px-4 py-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-brand">
        {pad(h)}:{pad(m)}:{pad(s)}
      </p>
    </div>
  );
}

export default function ActiveJobsPage() {
  const { dict, lang } = useLang();
  const [jobs, setJobs] = useState<ActiveJob[] | null>(null);
  const [startedMap, setStartedMap] = useState<Record<string, string>>({});
  const [photoMap, setPhotoMap] = useState<Record<string, string[]>>({});
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, status, scheduled_date, start_time, duration_hours, total_price, prepayment_amount, notes, photo_urls, addresses (street, house_number, apartment, floor, postal_code, city)"
      )
      .eq("cleaner_id", userData.user.id)
      .in("status", ["assigned", "in_progress"])
      .order("scheduled_date");
    if (error) {
      setError(error.message);
      return;
    }
    const list = (data ?? []).map((b) => ({
      ...(b as unknown as Omit<ActiveJob, "address">),
      address: (b as unknown as { addresses: ActiveJob["address"] }).addresses ?? null,
    }));
    setJobs(list);

    // Devam eden işlerin başlangıç zamanı (sayaç için) — RLS: taraflar okuyabilir
    for (const job of list.filter((j) => j.status === "in_progress")) {
      const { data: ev } = await supabase
        .from("job_events")
        .select("created_at")
        .eq("booking_id", job.id)
        .eq("type", "started")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (ev) setStartedMap((m) => ({ ...m, [job.id]: ev.created_at }));
    }

    // Ev fotoğrafları (signed URL)
    for (const job of list.filter((j) => j.photo_urls?.length)) {
      fetch(`/api/jobs/${job.id}/photos`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.photos?.length && setPhotoMap((m) => ({ ...m, [job.id]: d.photos })))
        .catch(() => null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function withGps(action: (lat: number, lng: number) => void) {
    if (!navigator.geolocation) {
      setError(lang === "tr" ? "Tarayıcınız konum desteklemiyor." : "Ihr Browser unterstützt keine Standortermittlung.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => action(pos.coords.latitude, pos.coords.longitude),
      () =>
        setError(
          lang === "tr"
            ? "Konum alınamadı. Lütfen konum iznini verin."
            : "Standort konnte nicht ermittelt werden. Bitte erlauben Sie den Zugriff."
        ),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function transition(job: ActiveJob, kind: "start" | "complete") {
    setError(null);
    setWorking(job.id);
    withGps(async (lat, lng) => {
      try {
        const res = await fetch(`/api/jobs/${job.id}/${kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : dict.common.error);
      } finally {
        setWorking(null);
      }
    });
  }

  const cashAmount = (j: ActiveJob) =>
    (Number(j.total_price) - Number(j.prepayment_amount)).toFixed(2);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{dict.dashboard.activeJobs}</h1>
      {error && <Banner tone="error">{error}</Banner>}

      {jobs === null && !error && <div className="h-48 animate-pulse rounded-2xl bg-ink/5" />}

      {jobs?.length === 0 && (
        <p className="rounded-2xl border border-ink/10 bg-white p-8 text-center text-sm text-ink/55">
          {lang === "tr" ? "Aktif işiniz yok. Açık işlere göz atın." : "Keine aktiven Aufträge. Sehen Sie sich die offenen Aufträge an."}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {jobs?.map((job) => (
          <article key={job.id} className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">
                {new Date(job.scheduled_date).toLocaleDateString(lang === "tr" ? "tr-TR" : "de-DE", { day: "numeric", month: "long" })}
                , {job.start_time.slice(0, 5)}
              </p>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  job.status === "in_progress" ? "bg-success/15 text-success" : "bg-brand-soft text-brand-dark"
                }`}
              >
                {job.status === "in_progress"
                  ? lang === "tr" ? "Devam Ediyor" : "Läuft"
                  : lang === "tr" ? "Atandı" : "Zugewiesen"}
              </span>
            </div>

            {job.status === "in_progress" && startedMap[job.id] && (
              <Countdown
                startedAt={startedMap[job.id]}
                durationHours={job.duration_hours}
                label={dict.jobs.remainingTime}
              />
            )}

            {job.address && (
              <p className="flex items-start gap-2 text-sm text-ink/85">
                <IconMapPin size={18} className="mt-0.5 shrink-0 text-brand-dark" />
                <span>
                  {job.address.street} {job.address.house_number}
                  {job.address.apartment ? `, ${job.address.apartment}` : ""}
                  {job.address.floor ? ` (${job.address.floor})` : ""}
                  <br />
                  {job.address.postal_code} {job.address.city}
                </span>
              </p>
            )}

            <p className="flex items-center gap-2 text-xs text-ink/55">
              <IconClock size={14} />
              {job.duration_hours} {dict.jobs.hours} ·{" "}
              {lang === "tr" ? "Nakit tahsilat" : "Barzahlung"}:{" "}
              <span className="font-bold text-ink tabular-nums">{cashAmount(job)} €</span>
            </p>

            {job.notes && (
              <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs text-ink/75">
                <span className="font-bold">{lang === "tr" ? "Müşteri notu: " : "Kundennotiz: "}</span>
                {job.notes}
              </p>
            )}

            {photoMap[job.id]?.length ? (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                  <IconCamera size={14} /> {lang === "tr" ? "Ev fotoğrafları" : "Fotos der Wohnung"}
                </p>
                <div className="flex gap-2 overflow-x-auto">
                  {photoMap[job.id].map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="size-16 rounded-lg border border-ink/10 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              {job.status === "assigned" ? (
                <button
                  type="button"
                  onClick={() => transition(job, "start")}
                  disabled={working !== null}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand text-sm font-extrabold text-ink transition-all duration-150 hover:bg-brand-dark active:scale-[0.98] disabled:opacity-40"
                >
                  <IconLocate size={18} />
                  {working === job.id ? dict.jobs.gpsVerifying : dict.jobs.startCleaning}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => transition(job, "complete")}
                  disabled={working !== null}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-success text-sm font-extrabold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                >
                  <IconCheckCircle size={18} />
                  {working === job.id ? dict.jobs.gpsVerifying : dict.jobs.completeCleaning}
                </button>
              )}

              <button
                type="button"
                onClick={() => setChatOpen((c) => (c === job.id ? null : job.id))}
                className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-ink/10 text-sm font-bold text-ink transition-colors hover:border-brand"
              >
                {dict.jobs.messageCustomer}
              </button>
            </div>

            {chatOpen === job.id && (
              <ChatBox
                bookingId={job.id}
                placeholder={lang === "tr" ? "Mesajınız…" : "Ihre Nachricht…"}
                emptyText={
                  lang === "tr"
                    ? "Müşteriyle bu iş hakkında mesajlaşın."
                    : "Schreiben Sie dem Kunden zu diesem Auftrag."
                }
              />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

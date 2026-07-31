"use client";

// Aktif işler (mockup adım 7-10): atanan işin tam adresi, GPS'li
// 'Temizliğe Başla' ve 'Temizliği Tamamladım' butonları.
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "../lang-context";
import { Banner } from "@/components/ui";
import { IconMapPin, IconClock, IconLocate, IconCheckCircle } from "@/components/icons";

interface ActiveJob {
  id: string;
  status: "assigned" | "in_progress";
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  total_price: string;
  prepayment_amount: string;
  address: {
    street: string;
    house_number: string;
    apartment: string | null;
    floor: string | null;
    postal_code: string;
    city: string;
  } | null;
}

export default function ActiveJobsPage() {
  const { dict, lang } = useLang();
  const [jobs, setJobs] = useState<ActiveJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, status, scheduled_date, start_time, duration_hours, total_price, prepayment_amount, addresses (street, house_number, apartment, floor, postal_code, city)"
      )
      .eq("cleaner_id", userData.user.id)
      .in("status", ["assigned", "in_progress"])
      .order("scheduled_date");
    if (error) {
      setError(error.message);
      return;
    }
    setJobs(
      (data ?? []).map((b) => ({
        ...(b as unknown as Omit<ActiveJob, "address">),
        address: (b as unknown as { addresses: ActiveJob["address"] }).addresses ?? null,
      }))
    );
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
      <h1 className="text-xl font-extrabold">{dict.dashboard.activeJobs}</h1>
      {error && <Banner tone="error">{error}</Banner>}

      {jobs === null && !error && <div className="h-40 animate-pulse rounded-2xl bg-white/5" />}

      {jobs?.length === 0 && (
        <p className="rounded-2xl bg-white/5 p-6 text-center text-sm text-white/60">
          {lang === "tr" ? "Aktif işiniz yok. Açık işlere göz atın." : "Keine aktiven Aufträge. Sehen Sie sich die offenen Aufträge an."}
        </p>
      )}

      {jobs?.map((job) => (
        <article key={job.id} className="rounded-2xl bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">
              {new Date(job.scheduled_date).toLocaleDateString(lang === "tr" ? "tr-TR" : "de-DE", { day: "numeric", month: "long" })}
              , {job.start_time.slice(0, 5)}
            </p>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                job.status === "in_progress" ? "bg-success/20 text-success" : "bg-brand/20 text-brand"
              }`}
            >
              {job.status === "in_progress"
                ? lang === "tr" ? "Devam Ediyor" : "Läuft"
                : lang === "tr" ? "Atandı" : "Zugewiesen"}
            </span>
          </div>

          {job.address && (
            <p className="mt-3 flex items-start gap-2 text-sm text-white/85">
              <IconMapPin size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                {job.address.street} {job.address.house_number}
                {job.address.apartment ? `, ${job.address.apartment}` : ""}
                {job.address.floor ? ` (${job.address.floor})` : ""}
                <br />
                {job.address.postal_code} {job.address.city}
              </span>
            </p>
          )}

          <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
            <IconClock size={14} />
            {job.duration_hours} {dict.jobs.hours} ·{" "}
            {lang === "tr" ? "Nakit tahsilat" : "Barzahlung"}:{" "}
            <span className="font-bold text-white tabular-nums">{cashAmount(job)} €</span>
          </p>

          <div className="mt-4">
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
          </div>
        </article>
      ))}
    </div>
  );
}

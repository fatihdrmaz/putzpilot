"use client";

// Açık işler (mockup adım 5-6) — maskelenmiş adres + İşi Al → rezervasyon ücreti.
import { useEffect, useState } from "react";
import { useLang } from "../lang-context";
import { IconMapPin, IconClock, IconCalendar } from "@/components/icons";
import { Banner } from "@/components/ui";

interface OpenJob {
  id: string;
  city: string;
  district: string | null;
  postal_prefix: string;
  cleaning_type: string;
  size_m2: number | null;
  rooms: number | null;
  bathrooms: number | null;
  duration_hours: number;
  scheduled_date: string;
  start_time: string;
  total_price: string;
  reservation_fee_amount: string;
  approx_distance_km: number | null;
}

export default function OpenJobsPage() {
  const { dict, lang } = useLang();
  const [jobs, setJobs] = useState<OpenJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    function load(lat?: number, lng?: number) {
      const q = lat != null ? `?lat=${lat}&lng=${lng}` : "";
      fetch(`/api/jobs/open${q}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          setJobs(data.jobs);
        })
        .catch((e) => setError(e.message));
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(),
        { timeout: 5000 }
      );
    } else load();
  }, []);

  async function claim(job: OpenJob) {
    setClaiming(job.id);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const pay = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: job.id, type: "reservation_fee" }),
      });
      const payData = await pay.json();
      if (pay.status === 503) {
        setError(
          lang === "tr"
            ? "Ödeme sistemi yakında aktif olacak. İş 10 dakika sizin için kilitlendi."
            : "Das Zahlungssystem wird bald aktiviert. Der Auftrag ist 10 Minuten für Sie reserviert."
        );
        setClaiming(null);
        return;
      }
      if (!pay.ok) throw new Error(payData.error);
      window.location.href = payData.approve_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.common.error);
      setClaiming(null);
    }
  }

  const typeLabel = (t: string) =>
    lang === "tr"
      ? { normal: "Normal Temizlik", tasinma: "Taşınma Temizliği", insaat: "İnşaat Sonrası" }[t] ?? t
      : { normal: "Normale Reinigung", tasinma: "Umzugsreinigung", insaat: "Bauendreinigung" }[t] ?? t;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold">{dict.jobs.openJobs}</h1>
      {error && <Banner tone="error">{error}</Banner>}

      {jobs === null && !error && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {jobs?.length === 0 && (
        <p className="rounded-2xl bg-white/5 p-6 text-center text-sm text-white/60">
          {lang === "tr" ? "Şu anda açık iş yok. Daha sonra tekrar bakın." : "Derzeit keine offenen Aufträge. Schauen Sie später wieder vorbei."}
        </p>
      )}

      {jobs?.map((job) => (
        <article key={job.id} className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <IconCalendar size={16} className="text-brand" />
                {new Date(job.scheduled_date).toLocaleDateString(lang === "tr" ? "tr-TR" : "de-DE", { day: "numeric", month: "long" })}
                , {job.start_time.slice(0, 5)}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                <IconClock size={14} />
                {job.duration_hours} {dict.jobs.hours} — {typeLabel(job.cleaning_type)}
              </p>
            </div>
            <p className="text-xl font-extrabold tabular-nums text-brand">
              {Number(job.total_price).toFixed(0)} €
            </p>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-sm text-white/80">
            <IconMapPin size={16} className="text-brand" />
            {job.postal_prefix} {job.city}
            {job.district ? ` — ${job.district}` : ""}
            {job.approx_distance_km != null && (
              <span className="text-white/50">· ~{job.approx_distance_km} km</span>
            )}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {job.size_m2 ? `${job.size_m2} m² · ` : ""}
            {job.rooms ? `${job.rooms}+1 · ` : ""}
            {job.bathrooms ? `${job.bathrooms} ${lang === "tr" ? "banyo" : "Bad"}` : ""}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-white/60">
              {dict.jobs.reservationFee}:{" "}
              <span className="font-bold text-white tabular-nums">
                {Number(job.reservation_fee_amount).toFixed(2)} €
              </span>
            </p>
            <button
              type="button"
              onClick={() => claim(job)}
              disabled={claiming !== null}
              className="min-h-11 cursor-pointer rounded-xl bg-brand px-5 text-sm font-extrabold text-ink transition-all duration-150 hover:bg-brand-dark active:scale-[0.98] disabled:opacity-40"
            >
              {claiming === job.id ? "…" : dict.jobs.takeJob}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

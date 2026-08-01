"use client";

// Kazançlarım (PRD Bölüm 8) — bilgilendirme ekranı: cüzdan/bakiye/Para Çek YOK.
// Açık tema, masaüstünde iki sütun (özet + geçmiş).
import { useEffect, useState } from "react";
import { useLang } from "../lang-context";
import { IconStar } from "@/components/icons";

interface Earnings {
  monthly_earnings: number;
  total_earnings: number;
  jobs_completed: number;
  rating_avg: number | null;
  history: { booking_id: string; date: string; earned_cash: number; reservation_fee_paid: number }[];
}

export default function EarningsPage() {
  const { dict, lang } = useLang();
  const [data, setData] = useState<Earnings | null>(null);

  useEffect(() => {
    fetch("/api/cleaner/earnings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-ink">{dict.earnings.title}</h1>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl bg-brand p-5 text-ink">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/60">
              {dict.earnings.thisMonth}
            </p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums">
              {(data?.monthly_earnings ?? 0).toFixed(2)} €
            </p>
            <div className="mt-4 flex justify-between border-t border-ink/10 pt-3 text-sm font-semibold">
              <span>{dict.earnings.total}</span>
              <span className="tabular-nums">{(data?.total_earnings ?? 0).toFixed(2)} €</span>
            </div>
            <div className="mt-1 flex justify-between text-sm font-semibold">
              <span>{dict.dashboard.completedJobs}</span>
              <span className="tabular-nums">{data?.jobs_completed ?? 0}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm font-semibold">
              <span>{dict.dashboard.avgRating}</span>
              <span className="flex items-center gap-1 tabular-nums">
                {data?.rating_avg?.toFixed(1) ?? "—"} <IconStar size={13} />
              </span>
            </div>
          </section>

          <p className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-xs text-ink/60">
            {dict.earnings.cashInfo}
          </p>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-ink/70">{dict.earnings.history}</h2>
          {!data?.history?.length && (
            <p className="rounded-2xl border border-ink/10 bg-white p-6 text-center text-sm text-ink/50">
              {lang === "tr" ? "Henüz tamamlanan iş yok." : "Noch keine abgeschlossenen Aufträge."}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {data?.history?.map((h) => (
              <div key={h.booking_id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {new Date(h.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "de-DE")}
                  </p>
                  <p className="text-xs text-ink/50">
                    {dict.earnings.feePaid}: {h.reservation_fee_paid.toFixed(2)} €
                  </p>
                </div>
                <p className="font-extrabold tabular-nums text-success">
                  +{h.earned_cash.toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

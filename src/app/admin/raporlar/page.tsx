"use client";

// Admin raporlar (PRD Bölüm 12): özet + aylık kırılım + en iyi temizlikçiler.
import { useEffect, useState } from "react";
import { Banner } from "@/components/ui";
import { IconStar } from "@/components/icons";

interface Report {
  summary: {
    total_bookings: number;
    completed_bookings: number;
    cancellation_rate: number;
    average_rating: number | null;
    total_revenue: number;
  };
  monthly: { month: string; bookings: number; completed: number; cancelled: number; revenue: number }[];
  top_cleaners: { name: string; jobs_completed: number; rating_avg: number | null }[];
}

const MONTH_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export default function AdminReportsPage() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  const monthLabel = (m: string) => `${MONTH_TR[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`;
  const maxRevenue = Math.max(1, ...(data?.monthly.map((m) => m.revenue) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink">Raporlar</h1>
      {error && <Banner tone="error">{error}</Banner>}
      {!data && !error && <div className="h-48 animate-pulse rounded-2xl bg-ink/5" />}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Toplam Rezervasyon", value: String(data.summary.total_bookings) },
              { label: "Tamamlanan", value: String(data.summary.completed_bookings) },
              { label: "İptal Oranı", value: `%${data.summary.cancellation_rate}` },
              {
                label: "Ortalama Puan",
                value: data.summary.average_rating != null ? data.summary.average_rating.toFixed(2) : "—",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink/10 bg-white p-4">
                <p className="text-2xl font-extrabold tabular-nums text-ink">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-ink/55">{s.label}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-ink p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Toplam Platform Geliri
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">
              {data.summary.total_revenue.toFixed(2)} €
            </p>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="text-sm font-bold text-ink">Son 6 Ay — Gelir ve Rezervasyon</h2>
            <div className="mt-4 flex flex-col gap-3">
              {data.monthly.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-semibold text-ink/55">
                    {monthLabel(m.month)}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-ink/5">
                    <div
                      className="flex h-full items-center rounded-lg bg-brand px-2 text-[11px] font-bold text-ink transition-all"
                      style={{ width: `${Math.max(4, (m.revenue / maxRevenue) * 100)}%` }}
                    >
                      {m.revenue > 0 ? `${m.revenue.toFixed(0)} €` : ""}
                    </div>
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums text-ink/55">
                    {m.bookings} rez. · {m.cancelled} iptal
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="text-sm font-bold text-ink">En Çok İş Tamamlayan Temizlikçiler</h2>
            {data.top_cleaners.length === 0 && (
              <p className="mt-3 text-sm text-ink/50">Henüz onaylı temizlikçi yok.</p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {data.top_cleaners.map((c, i) => (
                <div key={c.name + i} className="flex items-center justify-between rounded-xl bg-ink/3 px-4 py-2.5">
                  <span className="text-sm font-semibold text-ink">
                    {i + 1}. {c.name}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-ink/60">
                    <span className="tabular-nums">{c.jobs_completed} iş</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <IconStar size={12} className="text-brand-dark" />
                      {c.rating_avg?.toFixed(1) ?? "—"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

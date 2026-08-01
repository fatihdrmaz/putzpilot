"use client";

// Kazançlarım (PRD Bölüm 8) — bilgilendirme ekranı: cüzdan/bakiye/Para Çek YOK.
// + Tamamlanan işlerde müşteriyi değerlendirme (mockup temizlikçi adım 11).
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../lang-context";
import { Banner, Button } from "@/components/ui";
import { IconCheckCircle, IconStar } from "@/components/icons";

interface Earnings {
  monthly_earnings: number;
  total_earnings: number;
  jobs_completed: number;
  rating_avg: number | null;
  history: {
    booking_id: string;
    date: string;
    earned_cash: number;
    reservation_fee_paid: number;
    reviewed: boolean;
  }[];
}

export default function EarningsPage() {
  const { dict, lang } = useLang();
  const [data, setData] = useState<Earnings | null>(null);
  const [rateOpen, setRateOpen] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/cleaner/earnings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitRating(bookingId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, rating: stars, comment }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setRateOpen(null);
      setStars(0);
      setComment("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.common.error);
    } finally {
      setBusy(false);
    }
  }

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
          {error && <Banner tone="error">{error}</Banner>}
          <div className="flex flex-col gap-2">
            {data?.history?.map((h) => (
              <div key={h.booking_id} className="rounded-xl border border-ink/10 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
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

                {/* Müşteri değerlendirmesi (mockup adım 11) */}
                {h.reviewed ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                    <IconCheckCircle size={14} />
                    {lang === "tr" ? "Müşteri değerlendirildi" : "Kunde bewertet"}
                  </p>
                ) : rateOpen === h.booking_id ? (
                  <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3">
                    <p className="text-xs font-bold text-ink">{dict.review.title}</p>
                    <div className="flex gap-1" role="radiogroup">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={stars === s}
                          aria-label={`${s}`}
                          onClick={() => setStars(s)}
                          className="cursor-pointer p-0.5"
                        >
                          <IconStar size={22} className={s <= stars ? "text-brand" : "text-ink/15"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={dict.review.commentOptional}
                      className="min-h-14 w-full rounded-xl border-2 border-ink/10 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                    />
                    <p className="text-[11px] text-ink/45">{dict.review.goodReviews}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => submitRating(h.booking_id)}
                        loading={busy}
                        disabled={!stars}
                        className="!min-h-10 flex-1 !text-xs"
                      >
                        {lang === "tr" ? "Gönder" : "Senden"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRateOpen(null)}
                        className="!min-h-10 flex-1 !text-xs"
                      >
                        {dict.common.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRateOpen(h.booking_id);
                      setStars(0);
                      setComment("");
                    }}
                    className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-brand-dark hover:underline"
                  >
                    <IconStar size={14} />
                    {lang === "tr" ? "Müşteriyi değerlendir" : "Kunden bewerten"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

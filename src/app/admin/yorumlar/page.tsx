"use client";

// Admin yorumlar/değerlendirmeler (PRD Bölüm 9: Yorumlar) — görüntüleme.
import { useEffect, useState } from "react";
import { Banner } from "@/components/ui";
import { IconStar } from "@/components/icons";

interface Review {
  id: string;
  reviewer: "customer" | "cleaner";
  rating: number;
  comment: string | null;
  created_at: string;
  from_name: string;
  to_name: string;
  booking_date: string | null;
}

const TABS = [
  { key: "", label: "Tümü" },
  { key: "customer", label: "Müşteri → Temizlikçi" },
  { key: "cleaner", label: "Temizlikçi → Müşteri" },
] as const;

function Stars({ n }: { n: number }) {
  return (
    <span className="flex" aria-label={`${n} yıldız`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <IconStar key={s} size={15} className={s <= n ? "text-brand" : "text-ink/15"} />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<string>("");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [meta, setMeta] = useState<{ count: number; average: number | null }>({ count: 0, average: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReviews(null);
    fetch(`/api/admin/reviews${tab ? `?reviewer=${tab}` : ""}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setReviews(d.reviews);
        setMeta({ count: d.count, average: d.average });
      })
      .catch((e) => setError(e.message));
  }, [tab]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">Yorumlar</h1>
        {meta.average != null && (
          <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2">
            <IconStar size={18} className="text-brand-dark" />
            <span className="font-extrabold tabular-nums text-ink">{meta.average.toFixed(2)}</span>
            <span className="text-xs text-ink/55">{meta.count} değerlendirme</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`cursor-pointer rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
              tab === t.key ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <Banner tone="error">{error}</Banner>}
      {reviews === null && !error && <div className="h-32 animate-pulse rounded-2xl bg-ink/5" />}
      {reviews?.length === 0 && (
        <p className="rounded-2xl border border-ink/10 bg-white p-8 text-center text-sm text-ink/50">
          Bu filtrede değerlendirme yok.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {reviews?.map((r) => (
          <article key={r.id} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">
                  {r.from_name} <span className="font-normal text-ink/40">→</span> {r.to_name}
                </p>
                <p className="text-xs text-ink/50">
                  {r.reviewer === "customer" ? "Müşteri değerlendirmesi" : "Temizlikçi değerlendirmesi"}
                  {r.booking_date ? ` · ${new Date(r.booking_date).toLocaleDateString("tr-TR")}` : ""}
                </p>
              </div>
              <Stars n={r.rating} />
            </div>
            {r.comment && <p className="mt-3 text-sm text-ink/75">“{r.comment}”</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

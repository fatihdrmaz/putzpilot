"use client";

// Müşteri rezervasyonları (Almanca) — mockup adım 10-14: durum takibi,
// temizlikçi profil kartı, iptal ve değerlendirme.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Banner, Button, Card } from "@/components/ui";
import {
  IconCalendar,
  IconCheckCircle,
  IconChevronLeft,
  IconMapPin,
  IconShield,
  IconSparkle,
  IconStar,
  IconUser,
} from "@/components/icons";
import { SupportWidget } from "@/components/support-widget";

interface Booking {
  id: string;
  status: string;
  cleaning_type: string;
  duration_hours: number;
  scheduled_date: string;
  start_time: string;
  total_price: string;
  prepayment_amount: string;
  cleaner_id: string | null;
  addresses: { street: string; house_number: string; postal_code: string; city: string } | null;
}

interface CleanerCard {
  name: string;
  rating_avg: number | null;
  jobs_completed: number;
  verified: boolean;
}

const STATUS_DE: Record<string, { label: string; tone: string }> = {
  pending_payment: { label: "Zahlung ausstehend", tone: "bg-brand-soft text-ink" },
  open: { label: "Reinigungskraft wird gesucht", tone: "bg-brand-soft text-ink" },
  assigned: { label: "Reinigungskraft zugewiesen", tone: "bg-success/10 text-success" },
  in_progress: { label: "Reinigung läuft", tone: "bg-success/10 text-success" },
  completed: { label: "Abgeschlossen", tone: "bg-ink/5 text-ink/70" },
  cancelled: { label: "Storniert", tone: "bg-danger/10 text-danger" },
};

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Bewertung">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} Sterne`}
          onClick={() => onChange(s)}
          className="cursor-pointer p-1"
        >
          <IconStar size={26} className={s <= value ? "text-brand" : "text-ink/15"} />
        </button>
      ))}
    </div>
  );
}

export default function CustomerBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [cards, setCards] = useState<Record<string, CleanerCard>>({});
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [rating, setRating] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login?next=/buchungen");
      return;
    }
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, status, cleaning_type, duration_hours, scheduled_date, start_time, total_price, prepayment_amount, cleaner_id, addresses (street, house_number, postal_code, city)"
      )
      .eq("customer_id", userData.user.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      return;
    }
    const list = (data ?? []) as unknown as Booking[];
    setBookings(list);

    const { data: myReviews } = await supabase
      .from("reviews")
      .select("booking_id")
      .eq("reviewer", "customer");
    setReviewed(new Set((myReviews ?? []).map((r) => r.booking_id)));

    list
      .filter((b) => b.cleaner_id && ["assigned", "in_progress", "completed"].includes(b.status))
      .forEach((b) => {
        fetch(`/api/bookings/${b.id}/cleaner-card`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.cleaner && setCards((c) => ({ ...c, [b.id]: d.cleaner })))
          .catch(() => null);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelBooking(id: string) {
    if (!window.confirm("Buchung wirklich stornieren? Es gelten die Stornobedingungen.")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "customer_request" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice("Ihre Buchung wurde storniert. Etwaige Erstattungen erfolgen über PayPal.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(null);
    }
  }

  async function submitReview(id: string) {
    const stars = rating[id];
    if (!stars) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, rating: stars, comment: comment[id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice("Vielen Dank für Ihre Bewertung!");
      setReviewed((s) => new Set(s).add(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link href="/" aria-label="Startseite" className="flex size-11 items-center justify-center rounded-xl hover:bg-ink/5">
          <IconChevronLeft size={22} className="text-ink" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
            <IconSparkle size={16} className="text-ink" />
          </span>
          <span className="font-extrabold text-ink">Meine Buchungen</span>
        </div>
        <span className="w-11" />
      </header>

      {error && <div className="mb-3"><Banner tone="error">{error}</Banner></div>}
      {notice && <div className="mb-3"><Banner tone="success">{notice}</Banner></div>}

      {bookings === null && !error && <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />}

      {bookings?.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink/60">Sie haben noch keine Buchungen.</p>
          <Link href="/buchen" className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-bold text-ink hover:bg-brand-dark">
            Jetzt Reinigung buchen
          </Link>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {bookings?.map((b) => {
          const st = STATUS_DE[b.status] ?? { label: b.status, tone: "bg-ink/5 text-ink" };
          const card = cards[b.id];
          const cancellable = ["pending_payment", "open", "assigned"].includes(b.status);
          const trackable = ["assigned", "in_progress"].includes(b.status);
          const canReview = b.status === "completed" && !reviewed.has(b.id);
          return (
            <Card key={b.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <IconCalendar size={16} className="text-brand-dark" />
                  {new Date(b.scheduled_date).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                  , {b.start_time.slice(0, 5)} Uhr
                </p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${st.tone}`}>{st.label}</span>
              </div>

              {b.addresses && (
                <p className="flex items-center gap-1.5 text-xs text-ink/60">
                  <IconMapPin size={14} />
                  {b.addresses.street} {b.addresses.house_number}, {b.addresses.postal_code} {b.addresses.city}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/60">{b.duration_hours} Std. Reinigung</span>
                <span className="font-extrabold tabular-nums text-ink">{Number(b.total_price).toFixed(2)} €</span>
              </div>

              {card && (
                <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white">
                    <IconUser size={22} className="text-brand-dark" />
                  </span>
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      {card.name}
                      {card.verified && <IconShield size={14} className="text-success" />}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-ink/60">
                      <IconStar size={12} className="text-brand-dark" />
                      {card.rating_avg?.toFixed(1) ?? "Neu"} · {card.jobs_completed} Aufträge
                    </p>
                  </div>
                </div>
              )}

              {b.status === "completed" && reviewed.has(b.id) && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <IconCheckCircle size={16} /> Bewertung abgegeben — vielen Dank!
                </p>
              )}

              {canReview && (
                <div className="flex flex-col gap-2 rounded-xl border border-ink/10 p-3">
                  <p className="text-sm font-bold text-ink">Wie war die Reinigung?</p>
                  <Stars value={rating[b.id] ?? 0} onChange={(v) => setRating((r) => ({ ...r, [b.id]: v }))} />
                  <textarea
                    placeholder="Kommentar (optional)"
                    value={comment[b.id] ?? ""}
                    onChange={(e) => setComment((c) => ({ ...c, [b.id]: e.target.value }))}
                    className="min-h-16 w-full rounded-xl border-2 border-ink/10 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                  <Button
                    onClick={() => submitReview(b.id)}
                    loading={busy === b.id}
                    disabled={!rating[b.id]}
                    className="w-full"
                  >
                    Bewertung senden
                  </Button>
                </div>
              )}

              {trackable && (
                <Link
                  href={`/buchungen/${b.id}`}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft"
                >
                  Live verfolgen
                </Link>
              )}

              {cancellable && (
                <Button variant="danger" loading={busy === b.id} onClick={() => cancelBooking(b.id)}>
                  Stornieren
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <SupportWidget />
    </main>
  );
}

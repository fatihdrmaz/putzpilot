"use client";

// Admin dashboard — özet sayılar.
import { useEffect, useState } from "react";
import Link from "next/link";

interface BookingRow {
  status: string;
  total_price: string;
  prepayment_amount: string;
  reservation_fee_amount: string;
  payments: { type: string; status: string; amount: string }[];
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [pendingCleaners, setPendingCleaners] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((d) => setBookings(d.bookings ?? []));
    fetch("/api/admin/cleaners?status=pending")
      .then((r) => (r.ok ? r.json() : { cleaners: [] }))
      .then((d) => setPendingCleaners((d.cleaners ?? []).length));
  }, []);

  const count = (s: string) => bookings?.filter((b) => b.status === s).length ?? 0;
  const revenue =
    bookings
      ?.flatMap((b) => b.payments ?? [])
      .filter((p) => p.status === "completed" && p.type !== "refund")
      .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const stats = [
    { label: "Açık İşler", value: count("open"), href: "/admin/rezervasyonlar" },
    { label: "Atanmış / Devam Eden", value: count("assigned") + count("in_progress"), href: "/admin/rezervasyonlar" },
    { label: "Tamamlanan", value: count("completed"), href: "/admin/rezervasyonlar" },
    { label: "Onay Bekleyen Temizlikçi", value: pendingCleaners ?? "…", href: "/admin/temizlikciler" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink">Panel</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-ink/10 bg-white p-4 transition-colors hover:border-brand">
            <p className="text-3xl font-extrabold tabular-nums text-ink">{s.value}</p>
            <p className="mt-1 text-xs font-semibold text-ink/60">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl bg-ink p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Platform Geliri (tahsil edilen ödemeler)
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{revenue.toFixed(2)} €</p>
        <p className="mt-1 text-xs text-white/50">Ön ödemeler (%20) + rezervasyon ücretleri (%10)</p>
      </div>
    </div>
  );
}

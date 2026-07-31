"use client";

// Rezervasyon listesi — durum filtresi + ödeme özeti.
import { useEffect, useState } from "react";
import { Banner } from "@/components/ui";

interface Row {
  id: string;
  status: string;
  cleaning_type: string;
  duration_hours: number;
  scheduled_date: string;
  start_time: string;
  total_price: string;
  customer: { first_name: string | null; last_name: string | null; phone: string | null } | null;
  cleaner: { first_name: string | null; last_name: string | null; phone: string | null } | null;
  addresses: { postal_code: string; city: string; district: string | null; street: string; house_number: string } | null;
  payments: { type: string; payer: string; amount: string; status: string }[];
}

const STATUS_TR: Record<string, string> = {
  pending_payment: "Ödeme bekliyor",
  open: "Açık",
  assigned: "Atandı",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const FILTERS = ["", "open", "assigned", "in_progress", "completed", "cancelled"] as const;

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<string>("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    fetch(`/api/admin/bookings${filter ? `?status=${filter}` : ""}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setRows(d.bookings);
      })
      .catch((e) => setError(e.message));
  }, [filter]);

  const fullName = (p: Row["customer"]) =>
    p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "—" : "—";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Rezervasyonlar</h1>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`cursor-pointer rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
              filter === f ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"
            }`}
          >
            {f === "" ? "Tümü" : STATUS_TR[f]}
          </button>
        ))}
      </div>

      {error && <Banner tone="error">{error}</Banner>}
      {rows === null && !error && <div className="h-32 animate-pulse rounded-2xl bg-ink/5" />}
      {rows?.length === 0 && (
        <p className="rounded-2xl border border-ink/10 bg-white p-8 text-center text-sm text-ink/50">
          Kayıt yok.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        {rows && rows.length > 0 && (
          <table className="w-full min-w-175 text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/2 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3 font-bold">Tarih</th>
                <th className="px-4 py-3 font-bold">Müşteri</th>
                <th className="px-4 py-3 font-bold">Temizlikçi</th>
                <th className="px-4 py-3 font-bold">Adres</th>
                <th className="px-4 py-3 font-bold">Tutar</th>
                <th className="px-4 py-3 font-bold">Ödemeler</th>
                <th className="px-4 py-3 font-bold">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {new Date(r.scheduled_date).toLocaleDateString("tr-TR")} {r.start_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">{fullName(r.customer)}</td>
                  <td className="px-4 py-3">{fullName(r.cleaner)}</td>
                  <td className="px-4 py-3 text-xs text-ink/60">
                    {r.addresses
                      ? `${r.addresses.street} ${r.addresses.house_number}, ${r.addresses.postal_code} ${r.addresses.city}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums">{Number(r.total_price).toFixed(2)} €</td>
                  <td className="px-4 py-3 text-xs">
                    {(r.payments ?? []).length === 0 && <span className="text-ink/40">—</span>}
                    {(r.payments ?? []).map((p, i) => (
                      <span
                        key={i}
                        className={`mr-1 inline-block rounded-md px-1.5 py-0.5 font-semibold ${
                          p.status === "completed"
                            ? "bg-success/10 text-success"
                            : p.status === "refunded" || p.type === "refund"
                              ? "bg-danger/10 text-danger"
                              : "bg-ink/5 text-ink/50"
                        }`}
                      >
                        {p.type === "prepayment" ? "Ön" : p.type === "reservation_fee" ? "Rez" : "İade"}{" "}
                        {Number(p.amount).toFixed(0)}€
                      </span>
                    ))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-lg bg-ink/5 px-2 py-1 text-xs font-bold text-ink/70">
                      {STATUS_TR[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";

// Fiyat kuralları (PRD Bölüm 9) — %20/%10/%35 ve saatlik baz fiyat yönetimi.
import { useEffect, useState } from "react";
import { Banner, Button, Field, Input } from "@/components/ui";

const LABELS: Record<string, string> = {
  prepayment_pct: "Müşteri ön ödemesi (%)",
  fee_pct: "Temizlikçi rezervasyon ücreti (%)",
  moving_pct: "Taşınma temizliği ek (%)",
  construction_pct: "İnşaat sonrası ek (%)",
  base_hour_price: "Saatlik baz fiyat (€)",
};

export default function AdminPricesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/price-rules")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setValues(
          Object.fromEntries(d.rules.map((x: { key: string; value: number }) => [x.key, String(x.value)]))
        );
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/price-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setNotice("Kurallar kaydedildi. Yeni rezervasyonlarda geçerli olacak.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Fiyat Kuralları</h1>
      {error && <Banner tone="error">{error}</Banner>}
      {notice && <Banner tone="success">{notice}</Banner>}

      <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5">
        {Object.entries(LABELS).map(([key, label]) => (
          <Field key={key} label={label} htmlFor={key}>
            <Input
              id={key}
              inputMode="decimal"
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </Field>
        ))}
        <Button onClick={save} loading={saving}>
          Kaydet
        </Button>
        <p className="text-xs text-ink/50">
          Değişiklikler yalnızca yeni oluşturulan rezervasyonları etkiler; mevcut
          rezervasyonların tutarları sabit kalır.
        </p>
      </div>
    </div>
  );
}

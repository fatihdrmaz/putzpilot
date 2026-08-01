"use client";

// Admin ayarlar (PRD Bölüm 12): platform işleyiş parametreleri.
// Fiyat yüzdeleri ayrı "Fiyat Kuralları" sayfasında; burada operasyonel ayarlar.
import { useEffect, useState } from "react";
import { Banner, Button, Field, Input } from "@/components/ui";

const LABELS: Record<string, { label: string; helper: string }> = {
  gps_max_distance_m: {
    label: "GPS doğrulama eşiği (metre)",
    helper: "Temizlikçi 'Başla/Tamamla' derken adrese en fazla bu kadar uzak olabilir.",
  },
  claim_lock_minutes: {
    label: "İşi Al kilidi (dakika)",
    helper: "Temizlikçi 'İşi Al' dedikten sonra ödeme için işin kilitli kalacağı süre.",
  },
};

export default function AdminSettingsPage() {
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
          Object.fromEntries(
            d.rules
              .filter((x: { key: string }) => x.key in LABELS)
              .map((x: { key: string; value: number }) => [x.key, String(x.value)])
          )
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
        body: JSON.stringify(
          Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
        ),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setNotice("Ayarlar kaydedildi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Ayarlar</h1>
      {error && <Banner tone="error">{error}</Banner>}
      {notice && <Banner tone="success">{notice}</Banner>}

      <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5">
        {Object.entries(LABELS).map(([key, { label, helper }]) => (
          <Field key={key} label={label} htmlFor={key} helper={helper}>
            <Input
              id={key}
              inputMode="numeric"
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </Field>
        ))}
        <Button onClick={save} loading={saving}>
          Kaydet
        </Button>
        <p className="text-xs text-ink/50">
          Fiyat yüzdeleri ve saatlik baz fiyat için &quot;Fiyat Kuralları&quot; sayfasını kullanın.
        </p>
      </div>
    </div>
  );
}

"use client";

// Temizlikçi onay kuyruğu — belgeler signed URL ile görüntülenir.
import { useCallback, useEffect, useState } from "react";
import { Banner, Button } from "@/components/ui";
import { IconCheckCircle, IconStar } from "@/components/icons";

interface Cleaner {
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  registered_at: string;
  verification_status: "pending" | "approved" | "rejected";
  rating_avg: number | null;
  jobs_completed: number;
  id_document_url: string | null;
  residence_document_url: string | null;
}

const TABS = [
  { key: "pending", label: "Onay Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "rejected", label: "Reddedilen / Askıda" },
] as const;

export default function AdminCleanersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [cleaners, setCleaners] = useState<Cleaner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setCleaners(null);
    fetch(`/api/admin/cleaners?status=${tab}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setCleaners(d.cleaners);
      })
      .catch((e) => setError(e.message));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function verify(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cleaners/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Temizlikçiler</h1>
      <div className="flex gap-1">
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
      {cleaners === null && !error && <div className="h-32 animate-pulse rounded-2xl bg-ink/5" />}
      {cleaners?.length === 0 && (
        <p className="rounded-2xl border border-ink/10 bg-white p-8 text-center text-sm text-ink/50">
          Bu durumda temizlikçi yok.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {cleaners?.map((c) => (
          <article key={c.user_id} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-bold text-ink">
                  {c.name || "(isimsiz)"}
                  {c.verification_status === "approved" && (
                    <IconCheckCircle size={16} className="text-success" />
                  )}
                </p>
                <p className="text-xs text-ink/55">
                  {c.email} · {c.phone ?? "telefon yok"} · kayıt:{" "}
                  {new Date(c.registered_at).toLocaleDateString("tr-TR")}
                </p>
                {c.jobs_completed > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink/55">
                    <IconStar size={12} className="text-brand-dark" />
                    {c.rating_avg?.toFixed(1) ?? "—"} · {c.jobs_completed} iş
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {(["id_document_url", "residence_document_url"] as const).map((k) =>
                  c[k] ? (
                    <a
                      key={k}
                      href={c[k]!}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border-2 border-ink/10 px-3 py-2 text-xs font-bold text-ink hover:border-brand"
                    >
                      {k === "id_document_url" ? "Kimlik" : "İkamet"}
                    </a>
                  ) : (
                    <span key={k} className="rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/40">
                      {k === "id_document_url" ? "Kimlik yok" : "İkamet yok"}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {c.verification_status !== "approved" && (
                <Button
                  loading={busy === c.user_id}
                  onClick={() => verify(c.user_id, "approve")}
                  className="!min-h-10 !px-4 !text-xs"
                >
                  Onayla
                </Button>
              )}
              {c.verification_status !== "rejected" && (
                <Button
                  variant="danger"
                  loading={busy === c.user_id}
                  onClick={() => verify(c.user_id, "reject")}
                  className="!min-h-10 !px-4 !text-xs"
                >
                  {c.verification_status === "approved" ? "Askıya Al" : "Reddet"}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

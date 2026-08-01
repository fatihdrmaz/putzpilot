"use client";

// Admin destek (PRD Bölüm 8) — thread listesi + çeviri onaylı yanıt.
// Gelen mesaj Türkçe çevirisiyle gösterilir; admin Türkçe yazar, DE'ye çevrilip gönderilir.
import { useCallback, useEffect, useRef, useState } from "react";
import { Banner, Button } from "@/components/ui";
import { IconArrowRight, IconWhatsApp } from "@/components/icons";

interface ThreadRow {
  id: string;
  customer_name: string;
  phone: string | null;
  last_preview: string;
  needs_reply: boolean;
  updated_at: string;
}
interface Message {
  id: string;
  direction: "in" | "out";
  original_text: string;
  translated_text: string | null;
  language: string | null;
  created_at: string;
}

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ customer_name: string; messages: Message[] } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(() => {
    fetch("/api/admin/support")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setThreads(d.threads);
        if (!active && d.threads[0]) setActive(d.threads[0].id);
      })
      .catch((e) => setError(e.message));
  }, [active]);

  const loadDetail = useCallback((id: string) => {
    fetch(`/api/admin/support/${id}`)
      .then((r) => r.json())
      .then(setDetail)
      .catch(() => null);
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);
  useEffect(() => {
    if (active) loadDetail(active);
  }, [active, loadDetail]);
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [detail]);

  async function send() {
    if (!reply.trim() || !active) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/${active}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setReply("");
      loadDetail(active);
      loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">WhatsApp Destek</h1>
      {error && <Banner tone="error">{error}</Banner>}

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Thread listesi */}
        <div className="flex flex-col gap-2">
          {threads === null && <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />}
          {threads?.length === 0 && (
            <p className="rounded-2xl border border-ink/10 bg-white p-6 text-center text-sm text-ink/50">
              Henüz destek mesajı yok.
            </p>
          )}
          {threads?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`cursor-pointer rounded-xl border-2 p-3 text-left transition-colors ${
                active === t.id ? "border-brand bg-brand-soft" : "border-ink/10 bg-white hover:border-ink/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">{t.customer_name}</span>
                {t.needs_reply && <span className="size-2.5 rounded-full bg-danger" aria-label="Yanıt bekliyor" />}
              </div>
              <p className="mt-0.5 truncate text-xs text-ink/55">{t.last_preview || "—"}</p>
            </button>
          ))}
        </div>

        {/* Konuşma */}
        <div className="flex min-h-[28rem] flex-col rounded-2xl border border-ink/10 bg-white">
          {!detail ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink/40">
              <IconWhatsApp size={20} className="mr-2 text-success" /> Bir konuşma seçin
            </div>
          ) : (
            <>
              <div className="border-b border-ink/10 px-4 py-3">
                <p className="text-sm font-bold text-ink">{detail.customer_name}</p>
              </div>
              <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {detail.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      m.direction === "in"
                        ? "self-start rounded-bl-sm bg-ink/5"
                        : "self-end rounded-br-sm bg-brand-soft"
                    }`}
                  >
                    {/* Admin Türkçe okur: gelen -> çeviri (tr), giden -> orijinal (admin'in yazdığı tr) */}
                    <p className="text-sm text-ink">
                      {m.direction === "in" ? m.translated_text ?? m.original_text : m.original_text}
                    </p>
                    <p className="mt-1 text-[10px] text-ink/45">
                      {m.direction === "in"
                        ? `DE: ${m.original_text}`
                        : `DE gönderildi: ${m.translated_text ?? ""}`}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-ink/10 p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
                  placeholder="Türkçe yanıt yazın — otomatik Almanca'ya çevrilir…"
                  className="min-h-11 flex-1 rounded-xl border-2 border-ink/10 px-3 text-sm focus:border-brand focus:outline-none"
                />
                <Button onClick={send} loading={sending} disabled={!reply.trim()} className="!min-h-11 !px-4">
                  <IconArrowRight size={18} />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

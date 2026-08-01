"use client";

// Sabit WhatsApp destek butonu (PRD Bölüm 8) — müşteri Almanca yazar,
// admin Türkçe okur/yanıtlar (DeepL). Giriş yapılmamışsa login'e yönlendirir.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconWhatsApp, IconX, IconArrowRight } from "@/components/icons";

interface Msg {
  direction: "in" | "out";
  text: string;
  created_at: string;
}

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setLoggedIn(Boolean(data.user)));
  }, []);

  const load = () =>
    fetch("/api/support")
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => null);

  useEffect(() => {
    if (open && loggedIn) load();
  }, [open, loggedIn]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const body = text;
    setText("");
    setMessages((m) => [...m, { direction: "in", text: body, created_at: new Date().toISOString() }]);
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body }),
    }).catch(() => null);
    setSending(false);
    load();
  }

  return (
    <>
      {/* Yüzen buton */}
      <button
        type="button"
        aria-label="WhatsApp Support"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex size-14 cursor-pointer items-center justify-center rounded-full bg-success text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <IconX size={24} /> : <IconWhatsApp size={26} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
          <div className="flex items-center gap-2 bg-ink px-4 py-3 text-white">
            <span className="flex size-8 items-center justify-center rounded-full bg-success">
              <IconWhatsApp size={18} />
            </span>
            <div>
              <p className="text-sm font-bold">PutzPilot Support</p>
              <p className="text-[11px] text-white/60">Antwort meist in wenigen Minuten</p>
            </div>
          </div>

          {loggedIn === false ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-ink/60">Bitte melden Sie sich an, um den Support zu nutzen.</p>
              <Link href="/login" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-ink hover:bg-brand-dark">
                Anmelden
              </Link>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <p className="m-auto max-w-56 text-center text-xs text-ink/50">
                    Stellen Sie Ihre Frage auf Deutsch — unser Team antwortet Ihnen hier.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.direction === "in"
                        ? "self-end rounded-br-sm bg-brand text-ink"
                        : "self-start rounded-bl-sm bg-ink/5 text-ink"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-ink/10 p-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Ihre Nachricht…"
                  className="min-h-10 flex-1 rounded-xl border border-ink/10 px-3 text-sm focus:border-brand focus:outline-none"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !text.trim()}
                  aria-label="Senden"
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand text-ink hover:bg-brand-dark disabled:opacity-40"
                >
                  <IconArrowRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

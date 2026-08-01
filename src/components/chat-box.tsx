"use client";

// Müşteri <-> temizlikçi iş bazlı mesajlaşma (mockup: "Mesaj Gönder" /
// "Müşteriye Mesaj Gönder"). RLS: yalnızca atama sonrası taraflar yazabilir.
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconArrowRight } from "@/components/icons";

interface Msg {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export function ChatBox({
  bookingId,
  placeholder,
  emptyText,
}: {
  bookingId: string;
  placeholder: string;
  emptyText: string;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("booking_messages")
      .select("id, sender_id, text, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  }, [bookingId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    load();
    const t = setInterval(load, 10000); // 10 sn'de bir yenile
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function send() {
    if (!text.trim() || !userId) return;
    setSending(true);
    const body = text.trim();
    setText("");
    const supabase = createClient();
    const { error } = await supabase
      .from("booking_messages")
      .insert({ booking_id: bookingId, sender_id: userId, text: body });
    if (!error) await load();
    setSending(false);
  }

  return (
    <div className="flex flex-col rounded-xl border border-ink/10 bg-white">
      <div ref={scrollRef} className="flex max-h-56 min-h-24 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="m-auto text-center text-xs text-ink/45">{emptyText}</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm text-ink ${
              m.sender_id === userId
                ? "self-end rounded-br-sm bg-brand-soft"
                : "self-start rounded-bl-sm bg-ink/5"
            }`}
          >
            {m.text}
            <span className="mt-0.5 block text-[10px] text-ink/40">
              {new Date(m.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-ink/10 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
          placeholder={placeholder}
          className="min-h-10 flex-1 rounded-xl border border-ink/10 px-3 text-sm text-ink focus:border-brand focus:outline-none"
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
    </div>
  );
}

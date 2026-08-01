"use client";

// Canlı takip (müşteri, mockup adım 13) — rezervasyon durumu zaman çizelgesi.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Banner, Card } from "@/components/ui";
import {
  IconCheckCircle,
  IconChevronLeft,
  IconClock,
  IconLocate,
  IconShield,
  IconSparkle,
  IconStar,
  IconUser,
} from "@/components/icons";

interface Track {
  status: string;
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  events: { type: string; created_at: string }[];
  cleaner: { name: string; rating_avg: number | null; jobs_completed: number; verified: boolean } | null;
}

const STEPS = [
  { key: "created", label: "Buchung erstellt", desc: "Ihre Anfrage wurde aufgenommen." },
  { key: "assigned", label: "Reinigungskraft zugewiesen", desc: "Eine geprüfte Kraft übernimmt den Auftrag." },
  { key: "started", label: "Reinigung gestartet", desc: "Die Reinigungskraft ist eingetroffen." },
  { key: "completed", label: "Reinigung abgeschlossen", desc: "Bitte bewerten Sie den Auftrag." },
];

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/bookings/${params.id}/track`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // 20 sn'de bir canlı yenile
    return () => clearInterval(t);
  }, [load]);

  // Hangi adımlar tamamlandı?
  const reached = (key: string): "done" | "active" | "todo" => {
    if (!data) return "todo";
    const hasStarted = data.events.some((e) => e.type === "started");
    const order: Record<string, number> = { created: 0, assigned: 1, started: 2, completed: 3 };
    let current = 0;
    if (data.status === "cancelled") current = -1;
    else if (data.status === "completed") current = 3;
    else if (data.status === "in_progress" || hasStarted) current = 2;
    else if (data.status === "assigned") current = 1;
    else current = 0;
    const idx = order[key];
    if (idx < current) return "done";
    if (idx === current) return "active";
    return "todo";
  };

  const eventTime = (key: string) => {
    const map: Record<string, string> = { started: "started", completed: "completed" };
    const ev = data?.events.find((e) => e.type === map[key]);
    return ev ? new Date(ev.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null;
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link href="/buchungen" aria-label="Zurück" className="flex size-11 items-center justify-center rounded-xl hover:bg-ink/5">
          <IconChevronLeft size={22} className="text-ink" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
            <IconSparkle size={16} className="text-ink" />
          </span>
          <span className="font-extrabold text-ink">Live-Verfolgung</span>
        </div>
        <span className="w-11" />
      </header>

      {error && <Banner tone="error">{error}</Banner>}
      {!data && !error && <div className="h-64 animate-pulse rounded-2xl bg-ink/5" />}

      {data && (
        <div className="flex flex-col gap-4">
          {data.status === "cancelled" ? (
            <Banner tone="error">Diese Buchung wurde storniert.</Banner>
          ) : (
            <Card className="flex items-center gap-3 bg-brand-soft p-4">
              <IconClock size={22} className="text-brand-dark" />
              <div>
                <p className="text-sm font-bold text-ink">
                  {new Date(data.scheduled_date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-xs text-ink/60">
                  {data.start_time.slice(0, 5)} Uhr · {data.duration_hours} Stunden
                </p>
              </div>
            </Card>
          )}

          {data.cleaner && (
            <Card className="flex items-center gap-3 p-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
                <IconUser size={24} className="text-brand-dark" />
              </span>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  {data.cleaner.name}
                  {data.cleaner.verified && <IconShield size={14} className="text-success" />}
                </p>
                <p className="flex items-center gap-1 text-xs text-ink/60">
                  <IconStar size={12} className="text-brand-dark" />
                  {data.cleaner.rating_avg?.toFixed(1) ?? "Neu"} · {data.cleaner.jobs_completed} Aufträge
                </p>
              </div>
            </Card>
          )}

          {/* Zaman çizelgesi */}
          <Card className="p-5">
            <ol className="flex flex-col">
              {STEPS.map((s, i) => {
                const state = reached(s.key);
                const time = eventTime(s.key);
                return (
                  <li key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                          state === "done"
                            ? "bg-success text-white"
                            : state === "active"
                              ? "bg-brand text-ink"
                              : "bg-ink/10 text-ink/40"
                        }`}
                      >
                        {state === "done" ? (
                          <IconCheckCircle size={18} />
                        ) : state === "active" ? (
                          <IconLocate size={16} />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </span>
                      {i < STEPS.length - 1 && (
                        <span className={`my-1 w-0.5 flex-1 ${state === "done" ? "bg-success" : "bg-ink/10"}`} />
                      )}
                    </div>
                    <div className={`pb-6 ${state === "todo" ? "opacity-50" : ""}`}>
                      <p className="flex items-center gap-2 text-sm font-bold text-ink">
                        {s.label}
                        {time && <span className="text-xs font-medium text-ink/50">{time}</span>}
                        {state === "active" && (
                          <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-extrabold text-ink">
                            AKTUELL
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/55">{s.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {data.status === "completed" && (
            <Link
              href="/buchungen"
              className="flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-extrabold text-ink hover:bg-brand-dark"
            >
              Jetzt bewerten
            </Link>
          )}
        </div>
      )}
    </main>
  );
}

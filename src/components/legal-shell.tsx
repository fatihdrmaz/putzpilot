import Link from "next/link";
import { ReactNode } from "react";
import { IconChevronLeft, IconSparkle } from "@/components/icons";

// Yasal sayfalar için ortak kabuk (Impressum / Datenschutz / AGB).
export function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16">
      <header className="flex items-center justify-between py-5">
        <Link href="/" aria-label="Startseite" className="flex size-11 items-center justify-center rounded-xl hover:bg-ink/5">
          <IconChevronLeft size={22} className="text-ink" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
            <IconSparkle size={16} className="text-ink" />
          </span>
          <span className="font-extrabold text-ink">PutzPilot</span>
        </div>
        <span className="w-11" />
      </header>

      <h1 className="mt-2 text-3xl font-extrabold text-ink">{title}</h1>

      <div className="mt-4 rounded-xl border border-brand/40 bg-brand-soft px-4 py-3 text-xs text-ink/70">
        Vorlage — bitte vor Veröffentlichung mit den tatsächlichen Betreiberdaten ausfüllen
        und rechtlich prüfen lassen. Platzhalter sind mit [ ] markiert.
      </div>

      <div className="legal mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink/80">
        {children}
      </div>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-base font-bold text-ink">{heading}</h2>
      {children}
    </section>
  );
}

"use client";

// Müşteri tanıtım (landing) sayfası — Almanca, masaüstü + mobil uyumlu.
// Bölümler: Navbar · Hero · Güven rozetleri · So funktioniert's · Leistungen
// (Was ist inklusive) · Preise · Für Reinigungskräfte · Footer.
import { useState } from "react";
import Link from "next/link";
import {
  IconShield,
  IconCheckCircle,
  IconEuro,
  IconClock,
  IconWhatsApp,
  IconSparkle,
  IconMenu,
  IconX,
  IconArrowRight,
  IconBath,
  IconKitchen,
  IconSofa,
  IconBed,
  IconWindow,
  IconIron,
  IconFridge,
  IconOven,
  IconStar,
  IconMapPin,
} from "@/components/icons";
import { HeroIllustration } from "@/components/hero-illustration";
import { SupportWidget } from "@/components/support-widget";

const NAV = [
  { href: "#so-funktionierts", label: "So funktioniert's" },
  { href: "#leistungen", label: "Leistungen" },
  { href: "#preise", label: "Preise" },
  { href: "/register?rolle=cleaner", label: "Für Reinigungskräfte" },
];

const INKLUSIVE = [
  { icon: IconBath, label: "Badezimmer" },
  { icon: IconKitchen, label: "Küche" },
  { icon: IconSofa, label: "Wohnzimmer" },
  { icon: IconBed, label: "Schlafzimmer" },
  { icon: IconWindow, label: "Fenster" },
  { icon: IconIron, label: "Bügeln" },
  { icon: IconFridge, label: "Kühlschrank" },
  { icon: IconOven, label: "Backofen" },
];

const STEPS = [
  {
    n: "1",
    title: "Buchung anfragen",
    desc: "Adresse, Größe und Wunschtermin in 2 Minuten angeben — ganz ohne Anruf.",
  },
  {
    n: "2",
    title: "20% online anzahlen",
    desc: "Sie zahlen nur 20% als Anzahlung. Den Rest bar direkt nach der Reinigung.",
  },
  {
    n: "3",
    title: "Geprüfte Kraft kommt",
    desc: "Eine verifizierte Reinigungskraft übernimmt den Auftrag und startet pünktlich.",
  },
];

const PREISE = [
  { title: "Normale Reinigung", price: "Basispreis", badge: null, desc: "Standard-Haushaltsreinigung nach Ihren Prioritäten." },
  { title: "Umzugsreinigung", price: "+20%", badge: "Beliebt", desc: "Gründliche Tiefenreinigung bei Ein- oder Auszug." },
  { title: "Bauendreinigung", price: "+35%", badge: null, desc: "Nach Renovierung oder Bauarbeiten." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      {/* ---------- Navbar ---------- */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand">
              <IconSparkle size={20} className="text-ink" />
            </span>
            <span className="text-lg font-extrabold text-ink">PutzPilot</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-bold text-ink hover:bg-ink/5 sm:block"
            >
              Anmelden
            </Link>
            <Link
              href="/buchen"
              className="hidden rounded-xl bg-brand px-4 py-2 text-sm font-extrabold text-ink transition-colors hover:bg-brand-dark md:block"
            >
              Jetzt buchen
            </Link>
            <button
              type="button"
              aria-label="Menü"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl hover:bg-ink/5 md:hidden"
            >
              {menuOpen ? <IconX size={22} className="text-ink" /> : <IconMenu size={22} className="text-ink" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-ink/10 bg-background px-5 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
              >
                Anmelden
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-10 md:py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">
              <IconMapPin size={14} /> Verfügbar in Köln
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] text-ink md:text-5xl">
              Reinigung in Köln — <span className="rounded-lg bg-brand px-2">noch heute</span> verfügbar!
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
              Professionelle und geprüfte Reinigungskräfte in durchschnittlich 2 Stunden bei Ihnen zu
              Hause. Ohne Anruf, ohne Vertrag.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {[
                "Nur 20% Anzahlung — Rest bar nach der Reinigung",
                "Geprüfte Reinigungskräfte mit Identitätsnachweis",
                "Ohne langfristige Verpflichtung",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm font-medium text-ink/80">
                  <IconCheckCircle size={20} className="mt-0.5 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buchen"
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-extrabold text-ink transition-all duration-150 hover:bg-brand-dark active:scale-[0.98]"
              >
                Jetzt Reinigung buchen <IconArrowRight size={18} />
              </Link>
              <Link
                href="#so-funktionierts"
                className="flex min-h-13 items-center justify-center rounded-xl border-2 border-ink/15 px-6 py-4 text-base font-bold text-ink transition-colors hover:border-ink/30"
              >
                So funktioniert's
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink/50">Bereits über 1000+ zufriedene Kunden in Köln</p>
          </div>

          {/* Görsel alanı — özgün flat illüstrasyon (gerçek fotoğrafla değiştirilebilir) */}
          <div className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-linear-to-br from-brand-soft to-brand/40">
              <HeroIllustration className="absolute inset-0 size-full" />
              {/* Floating rating badge */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-sm">
                <IconStar size={18} className="text-brand-dark" />
                <span className="text-sm font-extrabold text-ink">4.9</span>
                <span className="text-xs text-ink/60">128 Bewertungen</span>
              </div>
              {/* Floating trust badge */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-sm">
                <IconShield size={18} className="text-success" />
                <span className="text-sm font-bold text-ink">Geprüft & versichert</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Güven rozetleri ---------- */}
      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-5 py-8 md:grid-cols-4">
          {[
            { icon: IconClock, title: "Kurzfristige Termine", desc: "In 2 Stunden bei Ihnen" },
            { icon: IconShield, title: "Geprüfte Kräfte", desc: "ID-verifiziert & bewertet" },
            { icon: IconEuro, title: "Faire Preise", desc: "Transparente Kosten" },
            { icon: IconCheckCircle, title: "Zufriedenheitsgarantie", desc: "oder Geld zurück" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft">
                <Icon size={22} className="text-brand-dark" />
              </span>
              <p className="text-sm font-bold text-ink">{title}</p>
              <p className="text-xs text-ink/55">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- So funktioniert's ---------- */}
      <section id="so-funktionierts" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-ink">So funktioniert's</h2>
          <p className="mt-2 text-sm text-ink/60">In drei einfachen Schritten zur sauberen Wohnung.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-ink/10 bg-white p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-lg font-extrabold text-brand">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Leistungen / Was ist inklusive ---------- */}
      <section id="leistungen" className="scroll-mt-20 border-y border-ink/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-14">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-ink">Was ist inklusive?</h2>
            <p className="mt-2 text-sm text-ink/60">
              Sie bestimmen die Prioritäten — Extras wie Fenster, Bügeln oder Backofen kosten nichts
              zusätzlich.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {INKLUSIVE.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 p-5 text-center transition-colors hover:border-brand"
              >
                <Icon size={26} className="text-brand-dark" />
                <span className="text-sm font-semibold text-ink">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Preise ---------- */}
      <section id="preise" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-ink">Transparente Preise</h2>
          <p className="mt-2 text-sm text-ink/60">
            Preis nach Dauer und Reinigungsart. 20% online, 80% bar nach der Reinigung.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PREISE.map((p) => (
            <div
              key={p.title}
              className={`relative rounded-2xl border-2 p-6 ${
                p.badge ? "border-brand bg-brand-soft" : "border-ink/10 bg-white"
              }`}
            >
              {p.badge && (
                <span className="absolute right-4 top-4 rounded-lg bg-brand px-2 py-1 text-xs font-extrabold text-ink">
                  {p.badge}
                </span>
              )}
              <p className="text-sm font-bold text-ink/60">{p.title}</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{p.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/buchen"
            className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-extrabold text-ink transition-all duration-150 hover:bg-brand-dark active:scale-[0.98]"
          >
            Preis berechnen & buchen <IconArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ---------- Für Reinigungskräfte ---------- */}
      <section className="bg-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-white">Als Reinigungskraft arbeiten</h2>
            <p className="mt-2 max-w-lg text-sm text-white/60">
              Verdienen Sie flexibel mit geprüften Aufträgen in Ihrer Nähe. Sie sehen die vollständige
              Adresse erst nach verbindlicher Annahme.
            </p>
          </div>
          <Link
            href="/register?rolle=cleaner"
            className="flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-extrabold text-ink transition-colors hover:bg-brand-dark"
          >
            Jetzt registrieren <IconArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ---------- WhatsApp / Footer ---------- */}
      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success">
                <IconWhatsApp size={20} className="text-white" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Fragen? Wir sind da.</p>
                <p className="text-xs text-ink/60">WhatsApp Support — 7/24 erreichbar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
                <IconSparkle size={16} className="text-ink" />
              </span>
              <span className="font-extrabold text-ink">PutzPilot</span>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-ink/10 pt-6 text-xs text-ink/40 sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} PutzPilot · Köln</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/impressum" className="font-semibold text-ink/60 hover:text-ink">
                Impressum
              </Link>
              <Link href="/datenschutz" className="font-semibold text-ink/60 hover:text-ink">
                Datenschutz
              </Link>
              <Link href="/agb" className="font-semibold text-ink/60 hover:text-ink">
                AGB
              </Link>
              <Link href="/register?rolle=cleaner" className="font-semibold text-ink/60 hover:text-ink">
                Für Reinigungskräfte
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportWidget />
    </div>
  );
}

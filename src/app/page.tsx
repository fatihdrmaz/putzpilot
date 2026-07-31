import Link from "next/link";
import {
  IconShield,
  IconCheckCircle,
  IconEuro,
  IconClock,
  IconWhatsApp,
  IconSparkle,
} from "@/components/icons";

// Müşteri landing — Almanca (mockup: Müşteri Akışı adım 1)
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand">
            <IconSparkle size={20} className="text-ink" />
          </span>
          <span className="text-lg font-extrabold text-ink">PutzPilot</span>
        </div>
        <Link
          href="/login"
          className="rounded-xl px-4 py-2 text-sm font-bold text-ink hover:bg-ink/5"
        >
          Anmelden
        </Link>
      </header>

      <section className="mt-4">
        <h1 className="text-4xl font-extrabold leading-tight text-ink">
          Reinigung in Köln —{" "}
          <span className="rounded-lg bg-brand px-1.5">noch heute</span> verfügbar!
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink/70">
          Professionelle und geprüfte Reinigungskräfte in durchschnittlich 2 Stunden
          bei Ihnen zu Hause.
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

        <Link
          href="/buchen"
          className="mt-8 flex min-h-13 w-full cursor-pointer items-center justify-center rounded-xl bg-brand px-6 py-4 text-base font-extrabold text-ink transition-all duration-150 hover:bg-brand-dark active:scale-[0.98]"
        >
          Jetzt Reinigung buchen
        </Link>
        <p className="mt-3 text-center text-xs text-ink/50">
          Bereits über 1000+ zufriedene Kunden in Köln
        </p>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3">
        {[
          { icon: IconShield, title: "Sicher", desc: "Identitätsprüfung & Versicherung" },
          { icon: IconCheckCircle, title: "Geprüft", desc: "Nur verifizierte Kräfte" },
          { icon: IconEuro, title: "Fair", desc: "Transparente Preise" },
          { icon: IconClock, title: "Schnell", desc: "Buchung in 2 Minuten" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-ink/10 bg-white p-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft">
              <Icon size={18} className="text-brand-dark" />
            </span>
            <p className="mt-2 text-sm font-bold text-ink">{title}</p>
            <p className="text-xs text-ink/60">{desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-ink p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success">
            <IconWhatsApp size={20} className="text-white" />
          </span>
          <div>
            <p className="text-sm font-bold">Fragen? Wir sind da.</p>
            <p className="text-xs text-white/60">WhatsApp Support — 7/24 erreichbar</p>
          </div>
        </div>
      </section>

      <footer className="mt-10 flex items-center justify-between text-xs text-ink/40">
        <span>© PutzPilot</span>
        <Link href="/panel" className="font-semibold text-ink/60 hover:text-ink">
          Als Reinigungskraft arbeiten
        </Link>
      </footer>
    </main>
  );
}

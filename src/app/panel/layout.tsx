"use client";

// Temizlikçi paneli — koyu tema (mockup: Temizlikçi Akışı), alt navigasyon,
// TR/DE dil değiştirici.
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LangProvider, useLang } from "./lang-context";
import { IconHome, IconBriefcase, IconWallet, IconUser } from "@/components/icons";

function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lang, dict, setLang } = useLang();

  const nav = [
    { href: "/panel", icon: IconHome, label: lang === "tr" ? "Ana Sayfa" : "Start" },
    { href: "/panel/isler", icon: IconBriefcase, label: dict.jobs.openJobs },
    { href: "/panel/kazanclar", icon: IconWallet, label: dict.earnings.title },
    { href: "/panel/profil", icon: IconUser, label: dict.dashboard.profile },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ink text-white">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <span className="text-lg font-extrabold">PutzPilot</span>
        <div className="flex rounded-xl bg-white/10 p-1" role="group" aria-label={dict.common.language}>
          {(["tr", "de"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                lang === l ? "bg-brand text-ink" : "text-white/60 hover:text-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 pt-2">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink pb-[max(env(safe-area-inset-bottom),8px)]">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-brand" : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <PanelShell>{children}</PanelShell>
    </LangProvider>
  );
}

"use client";

// Temizlikçi paneli — responsive:
// - Masaüstü (md+): sol koyu sidebar + açık içerik alanı (mockup adım 8)
// - Mobil: açık üst bar + alt navigasyon
// TR/DE dil değişimli.
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LangProvider, useLang } from "./lang-context";
import {
  IconHome,
  IconBriefcase,
  IconWallet,
  IconUser,
  IconCheckCircle,
  IconSparkle,
  IconLogout,
} from "@/components/icons";

function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, dict, setLang } = useLang();
  return (
    <div
      className={`flex rounded-xl p-1 ${compact ? "bg-ink/5" : "bg-white/10"}`}
      role="group"
      aria-label={dict.common.language}
    >
      {(["tr", "de"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
            lang === l
              ? "bg-brand text-ink"
              : compact
                ? "text-ink/50 hover:text-ink"
                : "text-white/60 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, dict } = useLang();

  const nav = [
    { href: "/panel", icon: IconHome, label: lang === "tr" ? "Ana Sayfa" : "Start" },
    { href: "/panel/isler", icon: IconBriefcase, label: dict.jobs.openJobs },
    { href: "/panel/aktif", icon: IconCheckCircle, label: dict.dashboard.activeJobs },
    { href: "/panel/kazanclar", icon: IconWallet, label: dict.earnings.title },
    { href: "/panel/profil", icon: IconUser, label: dict.dashboard.profile },
  ];

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* ---------- Masaüstü sidebar ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-ink px-4 py-5 text-white md:flex">
        <Link href="/panel" className="flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand">
            <IconSparkle size={20} className="text-ink" />
          </span>
          <span className="text-lg font-extrabold">PutzPilot</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                  active ? "bg-brand text-ink" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
          <LangSwitch />
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <IconLogout size={20} />
            {lang === "tr" ? "Çıkış Yap" : "Abmelden"}
          </button>
        </div>
      </aside>

      {/* ---------- İçerik ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil üst bar */}
        <header className="flex items-center justify-between px-5 py-3 md:hidden">
          <Link href="/panel" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
              <IconSparkle size={16} className="text-ink" />
            </span>
            <span className="font-extrabold text-ink">PutzPilot</span>
          </Link>
          <LangSwitch compact />
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-24 pt-2 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>

      {/* ---------- Mobil alt navigasyon ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white pb-[max(env(safe-area-inset-bottom),8px)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                  active ? "text-brand-dark" : "text-ink/45 hover:text-ink/70"
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

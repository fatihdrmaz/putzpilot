"use client";

// Admin paneli — responsive: masaüstü koyu sidebar + açık içerik, mobil üst bar + alt nav.
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconSparkle,
  IconHome,
  IconUser,
  IconBriefcase,
  IconWhatsApp,
  IconEuro,
  IconStar,
  IconLogout,
} from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Panel", icon: IconHome },
  { href: "/admin/temizlikciler", label: "Temizlikçiler", icon: IconUser },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar", icon: IconBriefcase },
  { href: "/admin/yorumlar", label: "Yorumlar", icon: IconStar },
  { href: "/admin/destek", label: "Destek", icon: IconWhatsApp },
  { href: "/admin/fiyatlar", label: "Fiyatlar", icon: IconEuro },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login?next=" + encodeURIComponent(pathname));
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      setAllowed(profile?.role === "admin");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
  }

  if (allowed === false) {
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center p-10">
        <p className="text-sm font-semibold text-danger">
          Bu sayfa yalnızca admin hesapları içindir.
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Masaüstü sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ink px-4 py-5 text-white md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand">
            <IconSparkle size={20} className="text-ink" />
          </span>
          <span className="text-base font-extrabold">Admin</span>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
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
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-t border-white/10 px-3 pt-4 text-sm font-semibold text-white/60 transition-colors hover:text-white"
        >
          <IconLogout size={19} />
          Çıkış Yap
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil üst + yatay nav */}
        <header className="border-b border-ink/10 bg-white md:hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
                <IconSparkle size={16} className="text-ink" />
              </span>
              <span className="font-extrabold text-ink">PutzPilot Admin</span>
            </div>
            <button type="button" onClick={logout} aria-label="Çıkış" className="cursor-pointer text-ink/50 hover:text-ink">
              <IconLogout size={20} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                  pathname === href ? "bg-brand text-ink" : "text-ink/55 hover:bg-ink/5"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 md:py-8">
          {allowed === null ? <div className="h-40 animate-pulse rounded-2xl bg-ink/5" /> : children}
        </main>
      </div>
    </div>
  );
}

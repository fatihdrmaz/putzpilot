"use client";

// Admin paneli — Türkçe, açık tema, geniş ekran uyumlu üst navigasyon.
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconSparkle } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/temizlikciler", label: "Temizlikçiler" },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar" },
  { href: "/admin/fiyatlar", label: "Fiyat Kuralları" },
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
      if (profile?.role !== "admin") {
        setAllowed(false);
        return;
      }
      setAllowed(true);
    });
    // pathname değişiminde tekrar kontrol gerekmez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (allowed === false) {
    return (
      <main className="flex flex-1 items-center justify-center p-10">
        <p className="text-sm font-semibold text-danger">
          Bu sayfa yalnızca admin hesapları içindir.
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
              <IconSparkle size={16} className="text-ink" />
            </span>
            <span className="font-extrabold text-ink">PutzPilot Admin</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                  pathname === href ? "bg-brand text-ink" : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {allowed === null ? <div className="h-40 animate-pulse rounded-2xl bg-ink/5" /> : children}
      </main>
    </div>
  );
}

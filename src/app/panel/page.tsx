"use client";

// Temizlikçi dashboard (mockup adım 8) — istatistik kartları + hızlı menü.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "./lang-context";
import {
  IconBriefcase,
  IconChevronRight,
  IconStar,
  IconWallet,
  IconCheckCircle,
  IconEuro,
} from "@/components/icons";

interface Earnings {
  monthly_earnings: number;
  total_earnings: number;
  jobs_completed: number;
  rating_avg: number | null;
}

export default function PanelDashboard() {
  const { dict, lang } = useLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login?next=/panel");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, role")
        .eq("id", data.user.id)
        .single();
      if (profile?.role !== "cleaner") {
        router.push("/register?rolle=cleaner&next=/panel");
        return;
      }
      setName(profile?.first_name ?? "");
      const { data: cp } = await supabase
        .from("cleaner_profiles")
        .select("verification_status")
        .eq("user_id", data.user.id)
        .single();
      setStatus(cp?.verification_status ?? "pending");
      fetch("/api/cleaner/earnings")
        .then((r) => (r.ok ? r.json() : null))
        .then(setEarnings)
        .catch(() => null);
    });
  }, [router]);

  const stats = [
    {
      label: dict.earnings.thisMonth,
      value: `${(earnings?.monthly_earnings ?? 0).toFixed(0)} €`,
      icon: IconEuro,
    },
    {
      label: dict.dashboard.completedJobs,
      value: String(earnings?.jobs_completed ?? 0),
      icon: IconCheckCircle,
    },
    {
      label: dict.dashboard.avgRating,
      value: earnings?.rating_avg?.toFixed(1) ?? "—",
      icon: IconStar,
    },
    {
      label: dict.earnings.total,
      value: `${(earnings?.total_earnings ?? 0).toFixed(0)} €`,
      icon: IconWallet,
    },
  ];

  const menu = [
    { href: "/panel/isler", label: dict.dashboard.openJobs, icon: IconBriefcase },
    { href: "/panel/aktif", label: dict.dashboard.activeJobs, icon: IconCheckCircle },
    { href: "/panel/kazanclar", label: dict.dashboard.earnings, icon: IconWallet },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink">
        {dict.dashboard.greeting}, {name || "…"} 👋
      </h1>

      {status && status !== "approved" && (
        <div className="rounded-xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm text-ink">
          {dict.documents.pendingInfo}{" "}
          <Link href="/panel/profil" className="font-bold underline">
            {dict.documents.title}
          </Link>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-ink/10 bg-white p-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft">
              <Icon size={18} className="text-brand-dark" />
            </span>
            <p className="mt-3 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-ink/55">{label}</p>
          </div>
        ))}
      </section>

      <nav className="flex flex-col gap-2">
        {menu.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 cursor-pointer items-center justify-between rounded-xl border border-ink/10 bg-white px-4 transition-colors hover:border-brand"
          >
            <span className="flex items-center gap-3 text-sm font-bold text-ink">
              <Icon size={20} className="text-brand-dark" />
              {label}
            </span>
            <IconChevronRight size={18} className="text-ink/35" />
          </Link>
        ))}
      </nav>

      <p className="text-center text-xs text-ink/45">
        {lang === "tr"
          ? "Kazançlar temizlik sonunda müşteriden nakit tahsil edilir."
          : "Einnahmen werden nach der Reinigung bar vom Kunden kassiert."}
      </p>
    </div>
  );
}

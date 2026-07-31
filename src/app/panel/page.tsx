"use client";

// Temizlikçi dashboard (mockup adım 4) — koyu tema, kazanç kartı, hızlı menü.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "./lang-context";
import { IconBriefcase, IconChevronRight, IconStar, IconWallet, IconCheckCircle } from "@/components/icons";

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

  const menu = [
    { href: "/panel/isler", label: dict.dashboard.openJobs, icon: IconBriefcase },
    { href: "/panel/aktif", label: dict.dashboard.activeJobs, icon: IconCheckCircle },
    { href: "/panel/kazanclar", label: dict.dashboard.earnings, icon: IconWallet },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">
        {dict.dashboard.greeting}, {name || "…"} 👋
      </h1>

      {status && status !== "approved" && (
        <div className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          {dict.documents.pendingInfo}{" "}
          <Link href="/panel/profil" className="font-bold underline">
            {dict.documents.title}
          </Link>
        </div>
      )}

      <section className="rounded-2xl bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
          {dict.earnings.thisMonth}
        </p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">
          {(earnings?.monthly_earnings ?? 0).toFixed(2)} €
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="text-white/50">{dict.dashboard.completedJobs}</p>
            <p className="font-bold tabular-nums">{earnings?.jobs_completed ?? 0}</p>
          </div>
          <div>
            <p className="text-white/50">{dict.dashboard.avgRating}</p>
            <p className="flex items-center gap-1 font-bold tabular-nums">
              {earnings?.rating_avg?.toFixed(1) ?? "—"}
              <IconStar size={14} className="text-brand" />
            </p>
          </div>
        </div>
      </section>

      <nav className="flex flex-col gap-2">
        {menu.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 cursor-pointer items-center justify-between rounded-xl bg-white/5 px-4 transition-colors hover:bg-white/10"
          >
            <span className="flex items-center gap-3 text-sm font-bold">
              <Icon size={20} className="text-brand" />
              {label}
            </span>
            <IconChevronRight size={18} className="text-white/40" />
          </Link>
        ))}
      </nav>

      <p className="text-center text-xs text-white/40">
        {lang === "tr"
          ? "Kazançlar temizlik sonunda müşteriden nakit tahsil edilir."
          : "Einnahmen werden nach der Reinigung bar vom Kunden kassiert."}
      </p>
    </div>
  );
}

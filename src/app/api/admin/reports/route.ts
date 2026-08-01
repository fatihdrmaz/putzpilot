import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin raporlar (PRD Bölüm 12): aylık rezervasyon/ciro, iptal oranı,
// ortalama puan, en iyi temizlikçiler.
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const admin = createAdminClient();

  const [{ data: bookings }, { data: payments }, { data: reviews }, { data: topCleaners }] =
    await Promise.all([
      admin.from("bookings").select("id, status, created_at, total_price"),
      admin.from("payments").select("amount, type, status, created_at"),
      admin.from("reviews").select("rating, reviewer"),
      admin
        .from("cleaner_profiles")
        .select("user_id, rating_avg, jobs_completed, profiles(first_name, last_name)")
        .eq("verification_status", "approved")
        .order("jobs_completed", { ascending: false })
        .limit(5),
    ]);

  // Son 6 ay anahtarları (YYYY-MM)
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthKey = (iso: string) => iso.slice(0, 7);

  const monthly = months.map((m) => {
    const monthBookings = (bookings ?? []).filter((b) => monthKey(b.created_at) === m);
    const revenue = (payments ?? [])
      .filter((p) => p.status === "completed" && p.type !== "refund" && monthKey(p.created_at) === m)
      .reduce((s, p) => s + Number(p.amount), 0);
    return {
      month: m,
      bookings: monthBookings.length,
      completed: monthBookings.filter((b) => b.status === "completed").length,
      cancelled: monthBookings.filter((b) => b.status === "cancelled").length,
      revenue: Math.round(revenue * 100) / 100,
    };
  });

  const total = (bookings ?? []).length;
  const cancelled = (bookings ?? []).filter((b) => b.status === "cancelled").length;
  const customerRatings = (reviews ?? []).filter((r) => r.reviewer === "customer");
  const avgRating =
    customerRatings.length > 0
      ? Math.round((customerRatings.reduce((s, r) => s + r.rating, 0) / customerRatings.length) * 100) / 100
      : null;
  const totalRevenue = (payments ?? [])
    .filter((p) => p.status === "completed" && p.type !== "refund")
    .reduce((s, p) => s + Number(p.amount), 0);

  return NextResponse.json({
    summary: {
      total_bookings: total,
      completed_bookings: (bookings ?? []).filter((b) => b.status === "completed").length,
      cancellation_rate: total > 0 ? Math.round((cancelled / total) * 1000) / 10 : 0,
      average_rating: avgRating,
      total_revenue: Math.round(totalRevenue * 100) / 100,
    },
    monthly,
    top_cleaners: (topCleaners ?? []).map((c) => {
      const p = c.profiles as unknown as { first_name: string | null; last_name: string | null };
      return {
        name: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—",
        jobs_completed: c.jobs_completed,
        rating_avg: c.rating_avg,
      };
    }),
  });
}

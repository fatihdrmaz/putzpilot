import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 'Kazançlarım' — bilgilendirme ekranı (PRD Bölüm 8).
// Cüzdan/bakiye YOK; kazanç = tamamlanan işlerde nakit tahsil edilen %80'ler.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const admin = createAdminClient();

  const { data: jobs, error } = await admin
    .from("bookings")
    .select("id, scheduled_date, total_price, prepayment_amount, reservation_fee_amount, status")
    .eq("cleaner_id", user.id)
    .in("status", ["completed", "assigned", "in_progress"])
    .order("scheduled_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const completed = jobs.filter((j) => j.status === "completed");
  const now = new Date();
  const isThisMonth = (d: string) => {
    const x = new Date(d);
    return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth();
  };

  // Temizlikçinin eline geçen: toplam - müşteri ön ödemesi (nakit %80),
  // maliyeti: ödediği %10 rezervasyon ücreti (bilgi amaçlı gösterilir)
  const cashOf = (j: (typeof jobs)[number]) =>
    Number(j.total_price) - Number(j.prepayment_amount);

  const { data: profile } = await admin
    .from("cleaner_profiles")
    .select("rating_avg, jobs_completed")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    monthly_earnings: completed.filter((j) => isThisMonth(j.scheduled_date)).reduce((s, j) => s + cashOf(j), 0),
    total_earnings: completed.reduce((s, j) => s + cashOf(j), 0),
    jobs_completed: profile?.jobs_completed ?? completed.length,
    rating_avg: profile?.rating_avg ?? null,
    history: completed.map((j) => ({
      booking_id: j.id,
      date: j.scheduled_date,
      earned_cash: cashOf(j),
      reservation_fee_paid: Number(j.reservation_fee_amount),
    })),
  });
}

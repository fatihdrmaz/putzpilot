import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Canlı takip (müşteri, mockup adım 13): rezervasyon durumu + olay zaman çizelgesi.
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]/track">) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, customer_id, cleaner_id, status, scheduled_date, start_time, duration_hours")
    .eq("id", id)
    .single();
  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { data: events } = await admin
    .from("job_events")
    .select("type, created_at")
    .eq("booking_id", id)
    .order("created_at", { ascending: true });

  // Cüzdansız kart bilgisi
  let cleaner = null;
  if (booking.cleaner_id) {
    const [{ data: profile }, { data: cp }] = await Promise.all([
      admin.from("profiles").select("first_name, last_name").eq("id", booking.cleaner_id).single(),
      admin
        .from("cleaner_profiles")
        .select("rating_avg, jobs_completed, verification_status")
        .eq("user_id", booking.cleaner_id)
        .single(),
    ]);
    cleaner = {
      name: `${profile?.first_name ?? ""} ${(profile?.last_name ?? "").charAt(0)}.`.trim(),
      rating_avg: cp?.rating_avg ?? null,
      jobs_completed: cp?.jobs_completed ?? 0,
      verified: cp?.verification_status === "approved",
    };
  }

  return NextResponse.json({
    status: booking.status,
    scheduled_date: booking.scheduled_date,
    start_time: booking.start_time,
    duration_hours: booking.duration_hours,
    events: events ?? [],
    cleaner,
  });
}

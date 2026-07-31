import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Müşteriye gösterilen temizlikçi profil kartı (PRD Bölüm 7):
// ad, puan, tamamlanan iş, doğrulama rozeti. Kişisel iletişim bilgisi YOK.
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]/cleaner-card">
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("customer_id, cleaner_id")
    .eq("id", id)
    .single();
  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!booking.cleaner_id) return NextResponse.json({ cleaner: null });

  const [{ data: profile }, { data: cp }] = await Promise.all([
    admin.from("profiles").select("first_name, last_name").eq("id", booking.cleaner_id).single(),
    admin
      .from("cleaner_profiles")
      .select("photo_url, rating_avg, jobs_completed, verification_status")
      .eq("user_id", booking.cleaner_id)
      .single(),
  ]);

  return NextResponse.json({
    cleaner: {
      name: `${profile?.first_name ?? ""} ${(profile?.last_name ?? "").charAt(0)}.`.trim(),
      photo_url: cp?.photo_url ?? null,
      rating_avg: cp?.rating_avg ?? null,
      jobs_completed: cp?.jobs_completed ?? 0,
      verified: cp?.verification_status === "approved",
    },
  });
}

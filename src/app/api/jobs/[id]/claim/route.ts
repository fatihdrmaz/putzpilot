import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadNumericSetting } from "@/lib/bookings";

// 'İşi Al' — işi 10 dakikalığına bu temizlikçiye kilitler; ardından
// create-order ile rezervasyon ücreti ödemesi başlatılır.
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/jobs/[id]/claim">) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { data: cleaner } = await supabase
    .from("cleaner_profiles")
    .select("verification_status")
    .eq("user_id", user.id)
    .single();
  if (cleaner?.verification_status !== "approved") {
    return NextResponse.json({ error: "Hesap henüz onaylanmadı" }, { status: 403 });
  }

  const admin = createAdminClient();
  const lockMinutes = await loadNumericSetting(admin, "claim_lock_minutes", 10);
  const cutoff = new Date(Date.now() - lockMinutes * 60 * 1000).toISOString();

  // Atomik kilit: iş open VE kilitsiz (veya kilidi bayat) ise kilitle
  const { data: locked, error } = await admin
    .from("bookings")
    .update({ claim_locked_by: user.id, claim_locked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open")
    .or(`claim_locked_at.is.null,claim_locked_at.lt.${cutoff},claim_locked_by.eq.${user.id}`)
    .select("id, reservation_fee_amount")
    .single();

  if (error || !locked) {
    return NextResponse.json(
      { error: "İş şu anda alınamıyor (başka bir temizlikçi işlemde olabilir)" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    booking_id: locked.id,
    reservation_fee_amount: locked.reservation_fee_amount,
    lock_expires_in_s: lockMinutes * 60,
  });
}

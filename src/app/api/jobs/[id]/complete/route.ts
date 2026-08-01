import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GPS_MAX_DISTANCE_M, haversineMeters } from "@/lib/pricing";
import { loadNumericSetting } from "@/lib/bookings";
import { sendWhatsAppTemplate } from "@/lib/notifications";

// 'Temizliği Tamamladım' — GPS tekrar doğrulanır; müşteriye tamamlama +
// değerlendirme mesajı gider. Kalan %80 nakit ödenir (platform dışı).
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/jobs/[id]/complete">
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { lat, lng } = await request.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "GPS konumu gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, cleaner_id, customer_id, address_id")
    .eq("id", id)
    .single();
  if (!booking || booking.cleaner_id !== user.id) {
    return NextResponse.json({ error: "Bu iş size atanmamış" }, { status: 403 });
  }
  if (booking.status !== "in_progress") {
    return NextResponse.json({ error: "İş devam ediyor durumunda değil" }, { status: 409 });
  }

  const { data: address } = await admin
    .from("addresses")
    .select("lat, lng")
    .eq("id", booking.address_id)
    .single();

  const gpsMax = await loadNumericSetting(admin, "gps_max_distance_m", GPS_MAX_DISTANCE_M);
  let distance: number | null = null;
  if (address?.lat != null && address?.lng != null) {
    distance = haversineMeters(lat, lng, address.lat, address.lng);
    if (distance > gpsMax) {
      await admin.from("job_events").insert({
        booking_id: booking.id,
        type: "gps_fail",
        lat,
        lng,
        distance_m: distance,
      });
      return NextResponse.json(
        { error: `Adres konumunda görünmüyorsunuz (~${distance} m).` },
        { status: 422 }
      );
    }
  }

  const { error } = await admin
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", booking.id)
    .eq("status", "in_progress");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_events").insert({
    booking_id: booking.id,
    type: "completed",
    lat,
    lng,
    distance_m: distance,
  });

  // Temizlikçi istatistiklerini güncelle (Kazançlarım ekranı bilgilendirme verisi)
  const { data: cp } = await admin
    .from("cleaner_profiles")
    .select("jobs_completed")
    .eq("user_id", user.id)
    .single();
  if (cp) {
    await admin
      .from("cleaner_profiles")
      .update({ jobs_completed: cp.jobs_completed + 1 })
      .eq("user_id", user.id);
  }

  const { data: customer } = await admin
    .from("profiles")
    .select("phone, language")
    .eq("id", booking.customer_id)
    .single();
  if (customer?.phone) {
    await sendWhatsAppTemplate({
      toPhone: customer.phone,
      template: "cleaning_completed",
      language: customer.language === "tr" ? "tr" : "de",
    });
  }

  return NextResponse.json({ status: "completed", distance_m: distance });
}

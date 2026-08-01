import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GPS_MAX_DISTANCE_M, haversineMeters } from "@/lib/pricing";
import { loadNumericSetting } from "@/lib/bookings";
import { sendWhatsAppTemplate } from "@/lib/notifications";

// 'Temizliğe Başla' — GPS doğrulamalı (PRD Bölüm 7).
// Adrese <= 250 m ise iş in_progress olur ve müşteriye WhatsApp gider.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]/start">) {
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
  if (booking.status !== "assigned") {
    return NextResponse.json({ error: "İş başlatılabilir durumda değil" }, { status: 409 });
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
        { error: `Adrese çok uzaksınız (~${distance} m). Adrese vardığınızda tekrar deneyin.` },
        { status: 422 }
      );
    }
  }
  // Adreste koordinat yoksa GPS kontrolü atlanır (fallback senaryosu: PRD Bölüm 18, açık konu)

  const { error } = await admin
    .from("bookings")
    .update({ status: "in_progress" })
    .eq("id", booking.id)
    .eq("status", "assigned");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_events").insert({
    booking_id: booking.id,
    type: "started",
    lat,
    lng,
    distance_m: distance,
  });

  const { data: customer } = await admin
    .from("profiles")
    .select("phone, language")
    .eq("id", booking.customer_id)
    .single();
  if (customer?.phone) {
    await sendWhatsAppTemplate({
      toPhone: customer.phone,
      template: "cleaner_arrived",
      language: customer.language === "tr" ? "tr" : "de",
    });
  }

  return NextResponse.json({ status: "in_progress", distance_m: distance });
}

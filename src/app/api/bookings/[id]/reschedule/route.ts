import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/notifications";

// Erteleme (PRD 11.3): müşteri, başlangıca 24 saatten fazla varken 1 kez
// ücretsiz tarih değiştirebilir. 24 saatten az kala erteleme yapılamaz
// (iptal + yeni rezervasyon gerekir).
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]/reschedule">
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { scheduled_date, start_time } = await request.json();
  if (!scheduled_date || !start_time) {
    return NextResponse.json({ error: "Neuer Termin erforderlich" }, { status: 400 });
  }
  const newStart = new Date(`${scheduled_date}T${start_time}`);
  if (Number.isNaN(newStart.getTime()) || newStart.getTime() < Date.now()) {
    return NextResponse.json({ error: "Der neue Termin liegt in der Vergangenheit." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, customer_id, cleaner_id, status, scheduled_date, start_time, reschedule_count")
    .eq("id", id)
    .single();
  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!["pending_payment", "open", "assigned"].includes(booking.status)) {
    return NextResponse.json(
      { error: "In diesem Status nicht möglich." },
      { status: 409 }
    );
  }

  const hoursUntilStart =
    (new Date(`${booking.scheduled_date}T${booking.start_time}`).getTime() - Date.now()) / 3_600_000;
  if (hoursUntilStart <= 24) {
    return NextResponse.json(
      {
        error:
          "Weniger als 24 Stunden bis zum Termin — bitte stornieren und neu buchen.",
      },
      { status: 409 }
    );
  }
  if (booking.reschedule_count >= 1) {
    return NextResponse.json(
      { error: "Kostenlose Terminverschiebung bereits genutzt." },
      { status: 409 }
    );
  }

  const { error } = await admin
    .from("bookings")
    .update({
      scheduled_date,
      start_time,
      reschedule_count: booking.reschedule_count + 1,
    })
    .eq("id", booking.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Atanmış temizlikçi varsa bilgilendir
  if (booking.cleaner_id) {
    const { data: cleaner } = await admin
      .from("profiles")
      .select("phone, language")
      .eq("id", booking.cleaner_id)
      .single();
    if (cleaner?.phone) {
      await sendWhatsAppTemplate({
        toPhone: cleaner.phone,
        template: "booking_cancelled", // yer tutucu: ayrı 'reschedule' şablonu eklenene dek
        language: cleaner.language === "tr" ? "tr" : "de",
      }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, scheduled_date, start_time });
}

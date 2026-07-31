import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Karşılıklı değerlendirme (PRD Bölüm 7). Insert RLS ile korunur:
// sadece tamamlanmış işin tarafı, kendi rolüyle, iş başına 1 kez.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { booking_id, rating, comment } = await request.json();
  const stars = Number(rating);
  if (!booking_id || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "booking_id ve 1-5 arası puan gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, customer_id, cleaner_id, status")
    .eq("id", booking_id)
    .single();
  if (!booking) return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });

  const reviewer =
    booking.customer_id === user.id ? "customer" : booking.cleaner_id === user.id ? "cleaner" : null;
  if (!reviewer) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  // RLS'li insert (kendi oturumuyla) — completed şartı ve teklik politikada
  const { error } = await supabase.from("reviews").insert({
    booking_id,
    reviewer,
    rating: stars,
    comment: comment?.slice(0, 1000) ?? null,
  });
  if (error) {
    const msg = error.code === "23505" ? "Bu iş için zaten değerlendirme yaptınız" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Müşteri değerlendirmesiyse temizlikçinin puan ortalamasını güncelle
  if (reviewer === "customer" && booking.cleaner_id) {
    const { data: ratings } = await admin
      .from("reviews")
      .select("rating, bookings!inner(cleaner_id)")
      .eq("reviewer", "customer")
      .eq("bookings.cleaner_id", booking.cleaner_id);
    if (ratings?.length) {
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      await admin
        .from("cleaner_profiles")
        .update({ rating_avg: Math.round(avg * 100) / 100 })
        .eq("user_id", booking.cleaner_id);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

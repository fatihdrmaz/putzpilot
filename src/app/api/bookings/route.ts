import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateQuote, CleaningType } from "@/lib/pricing";
import { loadPriceRules } from "@/lib/bookings";

// Rezervasyon oluşturur. Fiyat DAİMA sunucuda price_rules'tan hesaplanır;
// client'tan gelen tutarlara güvenilmez.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await request.json();
  const {
    address, // { postal_code, city, district, street, house_number, apartment, floor, lat, lng }
    cleaning_type,
    size_m2,
    rooms,
    bathrooms,
    duration_hours,
    priorities,
    has_pets,
    smoking,
    has_elevator,
    someone_home,
    photo_urls,
    notes,
    scheduled_date,
    start_time,
  } = body;

  if (!address?.postal_code || !address?.city || !address?.street || !address?.house_number) {
    return NextResponse.json({ error: "Adres bilgileri eksik" }, { status: 400 });
  }
  if (!scheduled_date || !start_time) {
    return NextResponse.json({ error: "Tarih ve saat gerekli" }, { status: 400 });
  }
  const type = (cleaning_type ?? "normal") as CleaningType;
  const hours = Number(duration_hours);
  if (!Number.isInteger(hours) || hours < 3 || hours > 8) {
    return NextResponse.json({ error: "Süre 3-8 saat olmalı" }, { status: 400 });
  }

  const admin = createAdminClient();
  const rules = await loadPriceRules(admin);
  const quote = calculateQuote(type, hours, rules);

  // Adres, kullanıcının kendi RLS'i ile eklenir
  const { data: addr, error: addrErr } = await supabase
    .from("addresses")
    .insert({
      customer_id: user.id,
      postal_code: address.postal_code,
      city: address.city,
      district: address.district ?? null,
      street: address.street,
      house_number: address.house_number,
      apartment: address.apartment ?? null,
      floor: address.floor ?? null,
      lat: address.lat ?? null,
      lng: address.lng ?? null,
    })
    .select("id")
    .single();
  if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 400 });

  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      address_id: addr.id,
      cleaning_type: type,
      size_m2: size_m2 ?? null,
      rooms: rooms ?? null,
      bathrooms: bathrooms ?? null,
      duration_hours: hours,
      priorities: priorities ?? [],
      has_pets: Boolean(has_pets),
      smoking: Boolean(smoking),
      has_elevator: Boolean(has_elevator),
      someone_home: Boolean(someone_home),
      photo_urls: photo_urls ?? [],
      notes: typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 1000) : null,
      scheduled_date,
      start_time,
      base_price: quote.basePrice,
      surcharge_pct: quote.surchargePct,
      total_price: quote.totalPrice,
      prepayment_amount: quote.prepaymentAmount,
      reservation_fee_amount: quote.reservationFeeAmount,
      status: "pending_payment",
    })
    .select("id, total_price, prepayment_amount, status")
    .single();
  if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 400 });

  return NextResponse.json({ booking, quote }, { status: 201 });
}

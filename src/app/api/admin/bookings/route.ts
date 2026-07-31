import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Tüm rezervasyonlar + ödeme durumları (admin görünümü).
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const status = request.nextUrl.searchParams.get("status");
  const admin = createAdminClient();

  let query = admin
    .from("bookings")
    .select(
      `id, status, cleaning_type, duration_hours, scheduled_date, start_time,
       total_price, prepayment_amount, reservation_fee_amount, created_at,
       customer:profiles!bookings_customer_id_fkey(first_name, last_name, phone),
       cleaner:profiles!bookings_cleaner_id_fkey(first_name, last_name, phone),
       addresses(postal_code, city, district, street, house_number),
       payments(type, payer, amount, status, created_at)`
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: data });
}

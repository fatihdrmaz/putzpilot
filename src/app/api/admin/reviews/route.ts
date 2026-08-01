import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin: tüm değerlendirmeler (müşteri ve temizlikçi). ?reviewer=customer|cleaner filtresi.
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const reviewer = request.nextUrl.searchParams.get("reviewer");
  const admin = createAdminClient();

  let query = admin
    .from("reviews")
    .select(
      `id, reviewer, rating, comment, created_at,
       bookings(scheduled_date, cleaning_type,
         customer:profiles!bookings_customer_id_fkey(first_name, last_name),
         cleaner:profiles!bookings_cleaner_id_fkey(first_name, last_name))`
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (reviewer === "customer" || reviewer === "cleaner") query = query.eq("reviewer", reviewer);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const name = (p: { first_name: string | null; last_name: string | null } | null) =>
    p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "—" : "—";

  const reviews = (data ?? []).map((r) => {
    const b = r.bookings as unknown as {
      scheduled_date: string;
      cleaning_type: string;
      customer: { first_name: string | null; last_name: string | null } | null;
      cleaner: { first_name: string | null; last_name: string | null } | null;
    } | null;
    return {
      id: r.id,
      reviewer: r.reviewer,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      // Değerlendiren -> değerlendirilen yönü
      from_name: r.reviewer === "customer" ? name(b?.customer ?? null) : name(b?.cleaner ?? null),
      to_name: r.reviewer === "customer" ? name(b?.cleaner ?? null) : name(b?.customer ?? null),
      booking_date: b?.scheduled_date ?? null,
    };
  });

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 100) / 100
      : null;

  return NextResponse.json({ reviews, count: reviews.length, average: avg });
}

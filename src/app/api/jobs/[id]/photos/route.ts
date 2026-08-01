import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Rezervasyonun ev fotoğrafları — signed URL ile. Erişim: müşteri (sahibi),
// atanmış temizlikçi ve admin. Private 'documents' bucket'ından servis edilir.
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/jobs/[id]/photos">) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("customer_id, cleaner_id, status, photo_urls")
    .eq("id", id)
    .single();
  if (!booking) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const isCustomer = booking.customer_id === user.id;
  const isAssignedCleaner =
    booking.cleaner_id === user.id &&
    ["assigned", "in_progress", "completed"].includes(booking.status);
  if (!isCustomer && !isAssignedCleaner && profile?.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const photos = await Promise.all(
    (booking.photo_urls ?? []).map(async (path: string) => {
      const { data } = await admin.storage.from("documents").createSignedUrl(path, 600);
      return data?.signedUrl ?? null;
    })
  );

  return NextResponse.json({ photos: photos.filter(Boolean) });
}

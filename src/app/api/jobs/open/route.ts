import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { haversineMeters } from "@/lib/pricing";

// Açık işler — SADECE maskelenmiş open_jobs view'ından (PRD Bölüm 10).
// ?lat=..&lng=.. verilirse yaklaşık mesafe (km) hesaplanır.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  // Sadece onaylı temizlikçiler açık işleri görür
  const { data: cleaner } = await supabase
    .from("cleaner_profiles")
    .select("verification_status")
    .eq("user_id", user.id)
    .single();
  if (cleaner?.verification_status !== "approved") {
    return NextResponse.json({ error: "Hesap henüz onaylanmadı" }, { status: 403 });
  }

  const { data: jobs, error } = await supabase
    .from("open_jobs")
    .select("*")
    .order("scheduled_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lat = parseFloat(request.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(request.nextUrl.searchParams.get("lng") ?? "");
  const withDistance = jobs.map((j) => ({
    ...j,
    approx_distance_km:
      Number.isFinite(lat) && Number.isFinite(lng) && j.approx_lat != null
        ? Math.round(haversineMeters(lat, lng, j.approx_lat, j.approx_lng) / 100) / 10
        : null,
    // koordinatlar client'a gönderilmez — sadece mesafe
    approx_lat: undefined,
    approx_lng: undefined,
  }));

  return NextResponse.json({ jobs: withDistance });
}

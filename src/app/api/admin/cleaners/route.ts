import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Temizlikçi listesi (onay kuyruğu) — belgeler private bucket'tan signed URL ile.
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const status = request.nextUrl.searchParams.get("status"); // pending|approved|rejected|null
  const admin = createAdminClient();

  let query = admin
    .from("cleaner_profiles")
    .select(
      "user_id, verification_status, rating_avg, jobs_completed, id_document_path, residence_document_path, approved_at, profiles!inner(first_name, last_name, phone, email, created_at)"
    )
    .order("approved_at", { ascending: false, nullsFirst: true });
  if (status) query = query.eq("verification_status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cleaners = await Promise.all(
    (data ?? []).map(async (c) => {
      const sign = async (path: string | null) =>
        path
          ? (await admin.storage.from("documents").createSignedUrl(path, 600)).data?.signedUrl ?? null
          : null;
      const profile = c.profiles as unknown as {
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        created_at: string;
      };
      return {
        user_id: c.user_id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        phone: profile.phone,
        email: profile.email,
        registered_at: profile.created_at,
        verification_status: c.verification_status,
        rating_avg: c.rating_avg,
        jobs_completed: c.jobs_completed,
        id_document_url: await sign(c.id_document_path),
        residence_document_url: await sign(c.residence_document_path),
      };
    })
  );

  return NextResponse.json({ cleaners });
}

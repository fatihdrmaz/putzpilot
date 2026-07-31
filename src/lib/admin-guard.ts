import { createClient } from "@/lib/supabase/server";

// Admin API uçları için ortak koruma: oturum + role=admin şartı.
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Giriş gerekli" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { ok: false, status: 403, error: "Yetkisiz" };
  }
  return { ok: true, userId: user.id };
}

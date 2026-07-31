import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role client — RLS'i bypass eder.
// SADECE sunucu tarafında (webhook, durum geçişleri, iade) kullanılır.
// Asla client bundle'a import edilmemelidir.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

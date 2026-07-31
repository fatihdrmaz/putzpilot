import { createBrowserClient } from "@supabase/ssr";

// Tarayıcı tarafı client (anon key — RLS geçerli)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

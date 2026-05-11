import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

// Single Supabase browser client for the whole app. The client is safe to
// recreate per call — under the hood it caches the underlying instance.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

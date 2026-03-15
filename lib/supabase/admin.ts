import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Database } from "./types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SUPABASE_SECRET_KEY!;

  if (!url || !key) {
    throw new Error("Missing Supabase secret key credentials.");
  }

  return createServiceClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
  });
};
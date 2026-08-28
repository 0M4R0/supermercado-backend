import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
);

export function createSupabaseUserClient(userJwt: string) {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
}

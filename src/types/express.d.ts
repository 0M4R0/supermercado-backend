import type { SupabaseClient, User } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userToken?: string;
      supabaseUser?: SupabaseClient;
    }
  }
}

export {};

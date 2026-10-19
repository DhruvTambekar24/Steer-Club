import "server-only";
import { createAdminClient } from "@supabase/server/core";
import type { SteerClubDatabase } from "@/lib/database.types";

const SUPABASE_URL = "https://mlrfhdxmlnctlhlyfkzo.supabase.co";

export function getSupabaseAdmin() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("The protected Supabase server key is not configured.");

  const configuredUrl = process.env.SUPABASE_URL ?? SUPABASE_URL;
  const parsedUrl = new URL(configuredUrl);
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "mlrfhdxmlnctlhlyfkzo.supabase.co") {
    throw new Error("The configured Supabase project URL is not the selected SteerClub project.");
  }

  return createAdminClient<SteerClubDatabase>({
    env: {
      url: configuredUrl,
      secretKeys: { default: secretKey },
    },
  });
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

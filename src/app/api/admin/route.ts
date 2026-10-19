import { createHash, timingSafeEqual } from "node:crypto";
import { apiJson } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const funnelSteps = [
  ["hero_view", "Hero viewed"],
  ["dial_locked", "Guess locked"],
  ["mode_selected", "Round selected"],
  ["game_completed", "Round completed"],
  ["wrapped_viewed", "Wrapped viewed"],
  ["share_clicked", "Share clicked"],
  ["care_opened", "Care opened"],
  ["lead_started", "Lead started"],
  ["lead_submitted", "Lead submitted"],
] as const;
const engagementSteps = [
  ["doubt_tapped", "Doubt tapped"],
  ["challenge_created", "Challenge created"],
  ["challenge_joined", "Challenge joined"],
  ["challenge_completed", "Challenge completed"],
] as const;

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!expected || !provided) return false;
  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return apiJson({ error: "The admin password is not valid." }, 401);
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("sc_events")
      .select("session_id,event_name,utm_source,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) throw error;
    const rows = data ?? [];
    const funnel = funnelSteps.map(([eventName, label]) => ({
      event: eventName,
      label,
      sessions: new Set(rows.filter((row) => row.event_name === eventName).map((row) => row.session_id)).size,
    }));
    const engagement = engagementSteps.map(([eventName, label]) => ({
      event: eventName,
      label,
      sessions: new Set(rows.filter((row) => row.event_name === eventName).map((row) => row.session_id)).size,
    }));
    const sources = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!row.utm_source) continue;
      const sessions = sources.get(row.utm_source) ?? new Set<string>();
      sessions.add(row.session_id);
      sources.set(row.utm_source, sessions);
    }
    return apiJson({
      since,
      sampledEvents: rows.length,
      capped: rows.length === 20000,
      engagement,
      funnel: funnel.map((step, index) => ({
        ...step,
        dropOff: index === 0 ? 0 : Math.max(0, funnel[index - 1].sessions - step.sessions),
      })),
      sources: [...sources.entries()].map(([source, sessions]) => ({ source, sessions: sessions.size })).sort((a, b) => b.sessions - a.sessions),
    });
  } catch {
    return apiJson({ error: "Funnel data is unavailable. Check the protected database configuration." }, 503);
  }
}
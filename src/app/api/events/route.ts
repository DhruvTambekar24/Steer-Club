import { apiJson, isRecord, readJsonBody, stringMap } from "@/lib/api";
import type { Json } from "@/lib/database.types";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventNames = new Set([
  "hero_view", "dial_locked", "mode_selected", "question_answered", "game_completed",
  "wrapped_viewed", "share_clicked", "challenge_created", "challenge_joined",
  "challenge_completed", "care_opened", "doubt_tapped", "lead_started", "lead_submitted",
  "scroll_depth",
]);
const allowedProps = new Set([
  "mode", "channel", "questionId", "correct", "elapsedMs", "guess", "doubt",
  "depth", "score", "total", "weakestTopic", "challengeId", "language",
]);

function cleanProps(value: unknown): Record<string, Json> {
  if (!isRecord(value)) return {};
  const clean: Record<string, Json> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!allowedProps.has(key)) continue;
    if (typeof entry === "string" && entry.length <= 120) clean[key] = entry;
    else if (typeof entry === "boolean") clean[key] = entry;
    else if (typeof entry === "number" && Number.isFinite(entry)) clean[key] = Math.max(0, Math.min(600000, Math.round(entry)));
  }
  return clean;
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request, 5000);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value) || !isUuid(parsed.value.sessionId) || typeof parsed.value.name !== "string" || !eventNames.has(parsed.value.name)) {
    return apiJson({ error: "The event note is incomplete." }, 400);
  }

  const utm = stringMap(parsed.value.utm);
  try {
    const database = getSupabaseAdmin();
    const { error: sessionError } = await database.from("sc_sessions").upsert({
      id: parsed.value.sessionId,
      utm: utm as Json,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (sessionError) throw sessionError;

    const { error } = await database.from("sc_events").insert({
      session_id: parsed.value.sessionId,
      event_name: parsed.value.name,
      props: cleanProps(parsed.value.props),
      utm_source: utm.utm_source ?? null,
    });
    if (error) throw error;
    return apiJson({ accepted: true }, 202);
  } catch {
    return apiJson({ error: "This note could not be recorded right now." }, 503);
  }
}
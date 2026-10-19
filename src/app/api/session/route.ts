import { addUtcDays, apiJson, isDoubtId, isRecord, readJsonBody, utcDateKey, utcWeekStart } from "@/lib/api";
import { doubtIds } from "@/lib/game";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";
import { questionById } from "@/lib/server-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id");
  if (!isUuid(id)) return apiJson({ error: "The anonymous session ID is invalid." }, 400);
  try {
    const supabase = getSupabaseAdmin();
    const today = utcDateKey();
    const [sessionQuery, dailyQuery, latestResultQuery] = await Promise.all([
      supabase.from("sc_sessions").select("current_streak,best_streak,last_daily_on,grace_used_week,saved_doubts,cleared_myths").eq("id", id).limit(1).maybeSingle(),
      supabase.from("sc_daily_completions").select("date_key").eq("session_id", id).gte("date_key", addUtcDays(today, -13)).lte("date_key", today).limit(14),
      supabase.from("sc_results").select("created_at").eq("session_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (sessionQuery.error || dailyQuery.error || latestResultQuery.error) throw new Error("Session lookup failed.");
    const row = sessionQuery.data;
    const lastResult = latestResultQuery.data;
    const lastPlayed = row?.last_daily_on ?? null;
    const graceUsedWeek = row?.grace_used_week ?? null;
    const gap = lastPlayed
      ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastPlayed}T00:00:00Z`)) / 86400000)
      : 999;
    const streakIsLive = gap <= 1 || (gap === 2 && graceUsedWeek !== utcWeekStart(today));
    const currentStreak = row && streakIsLive ? row.current_streak : 0;
    const calendar = (dailyQuery.data ?? []).map((item) => String(item.date_key).slice(0, 10));
    const savedDoubts = (row?.saved_doubts ?? []).filter((item): item is typeof doubtIds[number] => isDoubtId(item));
    const clearedMyths = (row?.cleared_myths ?? []).filter((item): item is string => typeof item === "string" && questionById.get(item)?.verdict === "myth");
    const nextMilestone = [3, 7, 14].find((milestone) => currentStreak < milestone) ?? 14;

    return apiJson({
      streak: currentStreak,
      bestStreak: row?.best_streak ?? 0,
      lastPlayed,
      returning: Boolean(lastResult),
      graceAvailable: graceUsedWeek !== utcWeekStart(today),
      graceWindowEnds: addUtcDays(utcWeekStart(today), 6),
      nextMilestone,
      calendar,
      savedDoubts: [...new Set(savedDoubts)],
      clearedMyths: [...new Set(clearedMyths)],
    });
  } catch {
    return apiJson({ error: "The anonymous note could not be read right now." }, 503);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value) || !isUuid(parsed.value.sessionId)) {
    return apiJson({ error: "The anonymous session ID is invalid." }, 400);
  }
  const rawDoubts = parsed.value.savedDoubts;
  const rawMyths = parsed.value.clearedMyths;
  if (!Array.isArray(rawDoubts) || rawDoubts.length > 5 || !rawDoubts.every(isDoubtId)) {
    return apiJson({ error: "The saved doubt list is invalid." }, 400);
  }
  if (!Array.isArray(rawMyths) || rawMyths.length > 34 || !rawMyths.every((item) => typeof item === "string" && questionById.get(item)?.verdict === "myth")) {
    return apiJson({ error: "The cleared-myth list is invalid." }, 400);
  }
  const savedDoubts = [...new Set(rawDoubts)];
  const clearedMyths = [...new Set(rawMyths)];
  const selectedDoubt = savedDoubts[savedDoubts.length - 1] ?? null;
  try {
    const { error } = await getSupabaseAdmin().from("sc_sessions").upsert({
      id: parsed.value.sessionId,
      selected_doubt: selectedDoubt,
      saved_doubts: savedDoubts,
      cleared_myths: clearedMyths,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) throw error;
    return apiJson({ savedDoubts, clearedMyths }, 200);
  } catch {
    return apiJson({ error: "Your private tracker could not be saved right now." }, 503);
  }
}

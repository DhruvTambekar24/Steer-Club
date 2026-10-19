import { apiJson, isRecord, readJsonBody, utcDateKey } from "@/lib/api";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props): Promise<Response> {
  const { id } = await params;
  if (!isUuid(id)) return apiJson({ error: "This challenge link is not valid." }, 404);
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value) || !isUuid(parsed.value.sessionId) || !Number.isInteger(parsed.value.habitDay)) {
    return apiJson({ error: "The habit check-in is incomplete." }, 400);
  }
  const sessionId = parsed.value.sessionId;
  const habitDay = Number(parsed.value.habitDay);
  if (habitDay < 1 || habitDay > 3) return apiJson({ error: "Choose one of the three shared habit days." }, 400);

  try {
    const supabase = getSupabaseAdmin();
    const { data: challenge, error: readError } = await supabase
      .from("sc_challenges")
      .select("sender_session_id,joined_session_id,state,habits_start_on")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    if (readError) throw readError;
    if (!challenge || challenge.state !== "completed" || !challenge.habits_start_on) {
      return apiJson({ error: "The shared habit opens after both people finish the round." }, 409);
    }
    if (sessionId !== challenge.sender_session_id && sessionId !== challenge.joined_session_id) {
      return apiJson({ error: "Only the two people in this challenge can check in." }, 403);
    }

    const start = Date.parse(`${challenge.habits_start_on}T00:00:00Z`);
    const today = Date.parse(`${utcDateKey()}T00:00:00Z`);
    const elapsedDay = Math.round((today - start) / 86400000) + 1;
    if (elapsedDay < 1 || elapsedDay > 3 || elapsedDay !== habitDay) {
      return apiJson({ error: "This check-in is for a different day of your shared habit." }, 409);
    }

    const { error: saveError } = await supabase.from("sc_challenge_checkins").upsert({
      challenge_id: id,
      session_id: sessionId,
      habit_day: habitDay,
      checked_in: true,
      checked_at: new Date().toISOString(),
    }, { onConflict: "challenge_id,session_id,habit_day" });
    if (saveError) throw saveError;
    return apiJson({ checkedIn: true, habitDay }, 201);
  } catch {
    return apiJson({ error: "That check-in could not be saved right now." }, 503);
  }
}

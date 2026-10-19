import { randomUUID } from "node:crypto";
import { apiJson, isRecord, readJsonBody } from "@/lib/api";
import { selectChallengeQuestions } from "@/lib/game";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";
import { questionBank } from "@/lib/server-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value)) return apiJson({ error: "The challenge note is incomplete." }, 400);
  const { sessionId, resultId } = parsed.value;
  if (!isUuid(sessionId) || !isUuid(resultId)) return apiJson({ error: "The anonymous note ID is invalid." }, 400);

  let firstName: string | null = null;
  if (parsed.value.firstName !== undefined && parsed.value.firstName !== null && parsed.value.firstName !== "") {
    if (typeof parsed.value.firstName !== "string") return apiJson({ error: "The first name must be text." }, 400);
    firstName = parsed.value.firstName.trim();
    if (firstName.length < 1 || firstName.length > 40) return apiJson({ error: "Use a first name of up to 40 characters, or leave it blank." }, 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: result, error: readError } = await supabase
      .from("sc_results")
      .select("id,session_id,mode,date_key,total,question_ids,selected_doubt")
      .eq("id", resultId)
      .eq("session_id", sessionId)
      .limit(1)
      .maybeSingle();
    if (readError) throw readError;
    if (!result || result.total !== 7 || result.mode === "daily") {
      return apiJson({ error: "Play the fair seven-note friend round before making a challenge link." }, 409);
    }
    const questionIds = result.question_ids as string[];
    try {
      selectChallengeQuestions(questionBank, result.selected_doubt, String(result.date_key), questionIds);
    } catch {
      return apiJson({ error: "This saved round is not the shared challenge set. Start a fair challenge round first." }, 409);
    }

    const id = randomUUID();
    const { error: insertError } = await supabase.from("sc_challenges").insert({
      id,
      sender_session_id: sessionId,
      sender_result_id: resultId,
      sender_first_name: firstName,
      question_ids: questionIds,
      mode: result.mode,
      state: "waiting",
    });
    if (insertError) throw insertError;
    return apiJson({ id, mode: result.mode, questionIds }, 201);
  } catch {
    return apiJson({ error: "The friend challenge could not be saved right now." }, 503);
  }
}

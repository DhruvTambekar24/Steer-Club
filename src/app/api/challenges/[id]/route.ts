import { apiJson } from "@/lib/api";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props): Promise<Response> {
  const { id } = await params;
  if (!isUuid(id)) return apiJson({ error: "This challenge link is not valid." }, 404);
  const viewerId = new URL(request.url).searchParams.get("sessionId");
  if (viewerId && !isUuid(viewerId)) return apiJson({ error: "The anonymous session ID is invalid." }, 400);

  try {
    const supabase = getSupabaseAdmin();
    const { data: challenge, error: challengeError } = await supabase
      .from("sc_challenges")
      .select("id,sender_session_id,sender_result_id,sender_first_name,joined_session_id,joined_result_id,question_ids,mode,state,habits_start_on,created_at")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    if (challengeError) throw challengeError;
    if (!challenge) return apiJson({ error: "This friend note could not be found." }, 404);

    const resultIds = [challenge.sender_result_id, challenge.joined_result_id].filter((value): value is string => Boolean(value));
    const { data: results, error: resultsError } = await supabase
      .from("sc_results")
      .select("id,score,total")
      .in("id", resultIds)
      .limit(2);
    if (resultsError) throw resultsError;
    const scoreById = new Map((results ?? []).map((item) => [item.id, { score: item.score, total: item.total }]));
    const { data: checkinRows, error: checkinError } = await supabase
      .from("sc_challenge_checkins")
      .select("session_id,habit_day,checked_in")
      .eq("challenge_id", id)
      .limit(6);
    if (checkinError) throw checkinError;

    const mySide = viewerId === challenge.sender_session_id ? "sender"
      : viewerId && viewerId === challenge.joined_session_id ? "friend" : "visitor";
    const senderChecked = new Set<number>();
    const friendChecked = new Set<number>();
    for (const checkin of checkinRows ?? []) {
      if (!checkin.checked_in) continue;
      if (checkin.session_id === challenge.sender_session_id) senderChecked.add(checkin.habit_day);
      if (checkin.session_id === challenge.joined_session_id) friendChecked.add(checkin.habit_day);
    }
    const senderResult = scoreById.get(challenge.sender_result_id) ?? null;
    const friendResult = challenge.joined_result_id ? scoreById.get(challenge.joined_result_id) ?? null : null;
    if (!senderResult) return apiJson({ error: "The shared note is not available." }, 503);

    return apiJson({
      id: challenge.id,
      state: challenge.state,
      mode: challenge.mode,
      firstName: challenge.sender_first_name,
      questionIds: challenge.question_ids,
      sender: senderResult,
      friend: friendResult,
      mySide,
      habitsStartOn: challenge.habits_start_on,
      checkins: {
        sender: [...senderChecked].sort((a, b) => a - b),
        friend: [...friendChecked].sort((a, b) => a - b),
      },
    });
  } catch {
    return apiJson({ error: "The friend note could not be read right now." }, 503);
  }
}

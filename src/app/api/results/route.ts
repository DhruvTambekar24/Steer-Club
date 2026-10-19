import { randomUUID } from "node:crypto";
import { apiJson, isDoubtId, isRecord, readJsonBody, stringMap, utcDateKey } from "@/lib/api";
import type { Json } from "@/lib/database.types";
import type { AnswerRecord, GameMode, GameQuestion } from "@/lib/game";
import { getHardestBelievedMyth, scoreTopics, selectChallengeQuestions, selectQuestions } from "@/lib/game";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";
import { questionBank, questionById } from "@/lib/server-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function validMode(value: unknown): value is GameMode {
  return value === "quick-quiz" || value === "myth-fact" || value === "daily";
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value)) return apiJson({ error: "The result note is incomplete." }, 400);

  const body = parsed.value;
  if (!isUuid(body.sessionId) || !validMode(body.mode) || !isDoubtId(body.selectedDoubt)) {
    return apiJson({ error: "The anonymous session or round details are invalid." }, 400);
  }
  const mode = body.mode;
  const selectedDoubt = body.selectedDoubt;
  const heroGuess = body.heroGuess;
  if (!Number.isInteger(heroGuess) || Number(heroGuess) < 0 || Number(heroGuess) > 100) {
    return apiJson({ error: "The opening guess must be from 0 to 100." }, 400);
  }
  if (!Array.isArray(body.questionIds) || !Array.isArray(body.answers)) {
    return apiJson({ error: "The question order or answers are missing." }, 400);
  }
  const total = mode === "daily" ? 5 : 7;
  if (body.questionIds.length !== total || body.answers.length !== total) {
    return apiJson({ error: "This round does not contain the expected number of notes." }, 400);
  }
  const questionIds = body.questionIds;
  if (!questionIds.every((id): id is string => typeof id === "string" && questionById.has(id))) {
    return apiJson({ error: "One or more question cards are not in the published bank." }, 400);
  }
  if (new Set(questionIds).size !== total) return apiJson({ error: "A question was repeated in this round." }, 400);

  const today = utcDateKey();
  if (typeof body.dateKey !== "string" || body.dateKey !== today) {
    return apiJson({ error: "This note has rolled over to a new day. Please start today’s round again." }, 409);
  }

  const challengeId = body.challengeId === undefined || body.challengeId === null || body.challengeId === ""
    ? null
    : isUuid(body.challengeId) ? body.challengeId : undefined;
  if (challengeId === undefined) return apiJson({ error: "The shared challenge link is invalid." }, 400);
  const isChallengeRound = body.challengeRound === true;
  if ((challengeId || isChallengeRound) && mode === "daily") {
    return apiJson({ error: "The daily five-note puzzle cannot be used for friend challenges." }, 400);
  }
  let expectedQuestions: GameQuestion[];
  const supabase = getSupabaseAdmin();
  try {
    if (challengeId) {
      const { data: challenge, error } = await supabase
        .from("sc_challenges")
        .select("id,state,mode,question_ids,sender_session_id")
        .eq("id", challengeId)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!challenge || challenge.state !== "waiting") return apiJson({ error: "This challenge is no longer open." }, 409);
      if (challenge.sender_session_id === body.sessionId) return apiJson({ error: "Send the challenge link to a friend so you can compare notes." }, 409);
      const challengeQuestionIds = challenge.question_ids as string[];
      if (challenge.mode !== mode || challengeQuestionIds.join("|") !== questionIds.join("|")) {
        return apiJson({ error: "This round does not match the shared challenge." }, 400);
      }
      expectedQuestions = selectChallengeQuestions(questionBank, selectedDoubt, today, challengeQuestionIds);
    } else if (isChallengeRound) {
      expectedQuestions = selectChallengeQuestions(questionBank, selectedDoubt, today, questionIds);
    } else {
      expectedQuestions = selectQuestions(questionBank, mode, selectedDoubt, today);
    }
  } catch {
    return apiJson({ error: "This question set is not available today." }, 503);
  }
  if (expectedQuestions.map((question) => question.id).join("|") !== questionIds.join("|")) {
    return apiJson({ error: "This round order does not match today’s note." }, 400);
  }

  const answers: AnswerRecord[] = [];
  for (let index = 0; index < total; index += 1) {
    const raw = body.answers[index];
    if (!isRecord(raw) || raw.questionId !== questionIds[index] || !Number.isInteger(raw.selectedIndex)) {
      return apiJson({ error: "One or more answers are incomplete." }, 400);
    }
    const question = questionById.get(questionIds[index]);
    if (!question) return apiJson({ error: "A question card is unavailable." }, 400);
    const selectedIndex = Number(raw.selectedIndex);
    const choiceCount = mode === "myth-fact" ? 2 : question.options.length;
    if (selectedIndex < 0 || selectedIndex >= choiceCount) return apiJson({ error: "An answer choice is out of range." }, 400);
    const elapsedMs = Number.isInteger(raw.elapsedMs) ? Math.max(0, Math.min(600000, Number(raw.elapsedMs))) : 0;
    const correctIndex = mode === "myth-fact" ? question.mythFactAnswer === "myth" ? 0 : 1 : question.correctIndex;
    answers.push({ questionId: question.id, selectedIndex, correct: selectedIndex === correctIndex, elapsedMs });
  }

  const scoring = scoreTopics(expectedQuestions, answers);
  const score = answers.filter((answer) => answer.correct).length;
  const hardestBelievedMyth = getHardestBelievedMyth(expectedQuestions, answers);
  const utm = stringMap(body.utm);
  const id = randomUUID();

  try {
    const { data, error } = await supabase.rpc("sc_save_game_result", {
      p_session_id: body.sessionId,
      p_result_id: id,
      p_mode: mode,
      p_date_key: today,
      p_score: score,
      p_total: total,
      p_question_ids: questionIds,
      p_answers: answers,
      p_topic_scores: scoring.scores as unknown as Json,
      p_weakest_topic: scoring.weakestTopic,
      p_hardest_believed_myth: hardestBelievedMyth,
      p_hero_guess: Number(heroGuess),
      p_selected_doubt: selectedDoubt,
      p_utm: utm,
      p_challenge_id: challengeId,
    });
    if (error) throw error;
    const saved = Array.isArray(data) ? data[0] : data;
    if (!saved || typeof saved !== "object") throw new Error("The result save returned no row.");
    const savedRow = saved as { saved_result_id?: string; current_streak?: number; challenge_completed?: boolean };
    if (savedRow.saved_result_id !== id) throw new Error("The saved result ID did not match the request.");
    return apiJson({
      id,
      score,
      total,
      answers,
      topicScores: scoring.scores,
      weakestTopic: scoring.weakestTopic,
      hardestBelievedMyth,
      selectedDoubt,
      streak: Number(savedRow.current_streak ?? 0),
      challengeCompleted: Boolean(savedRow.challenge_completed),
    }, 201);
  } catch {
    // Never return Supabase diagnostics or any protected value to the browser.
    return apiJson({ error: "The note could not be saved right now. Your result stays on this device." }, 503);
  }
}

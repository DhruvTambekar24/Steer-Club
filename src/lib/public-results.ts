import "server-only";
import type { AnswerRecord, GameMode, GameQuestion, GameResult, TopicId, TopicScore } from "@/lib/game";
import { isoDate } from "@/lib/api";
import { isUuid, getSupabaseAdmin } from "@/lib/server-db";
import { questionById } from "@/lib/server-questions";

export interface PublicResultBundle {
  result: GameResult;
  questions: GameQuestion[];
}

type ResultRow = {
  id: string;
  mode: GameMode;
  date_key: string | Date;
  score: number;
  total: number;
  question_ids: string[];
  answers: AnswerRecord[];
  topic_scores: Partial<Record<TopicId, TopicScore>>;
  weakest_topic: TopicId;
  hardest_believed_myth: GameResult["hardestBelievedMyth"];
  hero_guess: number;
  selected_doubt: GameResult["selectedDoubt"];
  created_at: string | Date;
};

export async function getPublicResult(id: string): Promise<PublicResultBundle | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("sc_results")
    .select("id,mode,date_key,score,total,question_ids,answers,topic_scores,weakest_topic,hardest_believed_myth,hero_guess,selected_doubt,created_at")
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ResultRow;
  const questions = row.question_ids.map((questionId) => questionById.get(questionId)).filter((item): item is GameQuestion => Boolean(item));
  if (questions.length !== row.question_ids.length) return null;
  const dateKey = isoDate(row.date_key);
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
  if (!dateKey || !Number.isFinite(Date.parse(createdAt))) return null;

  return {
    result: {
      id: row.id,
      sessionId: "",
      mode: row.mode,
      dateKey,
      score: row.score,
      total: row.total,
      answers: row.answers,
      topicScores: row.topic_scores,
      weakestTopic: row.weakest_topic,
      hardestBelievedMyth: row.hardest_believed_myth,
      heroGuess: row.hero_guess,
      selectedDoubt: row.selected_doubt,
      finishedAt: createdAt,
    },
    questions,
  };
}

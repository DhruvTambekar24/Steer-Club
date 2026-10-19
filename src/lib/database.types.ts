import type { AnswerRecord, DoubtId, GameMode, TopicId } from "@/lib/game";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type SessionRow = {
  id: string;
  selected_doubt: DoubtId | null;
  saved_doubts: DoubtId[];
  cleared_myths: string[];
  hero_guess: number | null;
  current_streak: number;
  best_streak: number;
  last_daily_on: string | null;
  grace_used_week: string | null;
  utm: Json;
  created_at: string;
  updated_at: string;
};

type ResultRow = {
  id: string;
  session_id: string;
  mode: GameMode;
  date_key: string;
  score: number;
  total: number;
  question_ids: string[];
  answers: Json;
  topic_scores: Json;
  weakest_topic: TopicId;
  hardest_believed_myth: Json;
  hero_guess: number;
  selected_doubt: DoubtId;
  created_at: string;
};

type ChallengeRow = {
  id: string;
  sender_session_id: string;
  sender_result_id: string;
  sender_first_name: string | null;
  joined_session_id: string | null;
  joined_result_id: string | null;
  question_ids: string[];
  mode: Exclude<GameMode, "daily">;
  state: "waiting" | "completed";
  habits_start_on: string | null;
  created_at: string;
  completed_at: string | null;
};

type CheckinRow = {
  challenge_id: string;
  session_id: string;
  habit_day: number;
  checked_in: boolean;
  checked_at: string;
};

type DailyCompletionRow = {
  session_id: string;
  date_key: string;
  result_id: string;
  created_at: string;
};

type EventRow = {
  id: number;
  session_id: string;
  event_name: string;
  props: Json;
  utm_source: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  submission_id: string;
  session_id: string;
  first_name: string;
  mobile: string;
  preferred_time: string;
  language: "en" | "hinglish";
  note: Json;
  consent_text: string;
  consented_at: string;
  utm_source: string | null;
  forwarded_at: string | null;
  created_at: string;
};

export type SteerClubDatabase = {
  public: {
    Tables: {
      sc_sessions: Table<
        SessionRow,
        Pick<SessionRow, "id"> & Partial<Omit<SessionRow, "id">>
      >;
      sc_results: Table<
        ResultRow,
        Pick<ResultRow, "id" | "session_id" | "mode" | "date_key" | "score" | "total" | "question_ids" | "answers" | "topic_scores" | "weakest_topic" | "hero_guess" | "selected_doubt"> & Partial<Pick<ResultRow, "hardest_believed_myth" | "created_at">>
      >;
      sc_challenges: Table<
        ChallengeRow,
        Pick<ChallengeRow, "id" | "sender_session_id" | "sender_result_id" | "question_ids" | "mode"> & Partial<Omit<ChallengeRow, "id" | "sender_session_id" | "sender_result_id" | "question_ids" | "mode">>
      >;
      sc_challenge_checkins: Table<
        CheckinRow,
        Pick<CheckinRow, "challenge_id" | "session_id" | "habit_day"> & Partial<Pick<CheckinRow, "checked_in" | "checked_at">>
      >;
      sc_daily_completions: Table<
        DailyCompletionRow,
        Pick<DailyCompletionRow, "session_id" | "date_key" | "result_id"> & Partial<Pick<DailyCompletionRow, "created_at">>
      >;
      sc_events: Table<
        EventRow,
        Pick<EventRow, "session_id" | "event_name"> & Partial<Pick<EventRow, "props" | "utm_source" | "created_at">>
      >;
      sc_leads: Table<
        LeadRow,
        Pick<LeadRow, "id" | "submission_id" | "session_id" | "first_name" | "mobile" | "preferred_time" | "language" | "note" | "consent_text" | "consented_at"> & Partial<Pick<LeadRow, "utm_source" | "forwarded_at" | "created_at">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      sc_save_game_result: {
        Args: {
          p_session_id: string;
          p_result_id: string;
          p_mode: GameMode;
          p_date_key: string;
          p_score: number;
          p_total: number;
          p_question_ids: string[];
          p_answers: AnswerRecord[];
          p_topic_scores: Json;
          p_weakest_topic: TopicId;
          p_hardest_believed_myth: Json;
          p_hero_guess: number;
          p_selected_doubt: DoubtId;
          p_utm?: Json;
          p_challenge_id?: string | null;
        };
        Returns: { saved_result_id: string; current_streak: number; challenge_completed: boolean }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

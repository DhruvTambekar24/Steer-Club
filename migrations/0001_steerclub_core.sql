-- Additive schema for Phases B/C. No existing public tables are modified or deleted.
CREATE TABLE IF NOT EXISTS public.sc_sessions (
  id uuid PRIMARY KEY,
  selected_doubt text CHECK (selected_doubt IN ('safe','muscle-loss','regain','diabetes-only','for-me')),
  hero_guess smallint CHECK (hero_guess BETWEEN 0 AND 100),
  current_streak smallint NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  best_streak smallint NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  last_daily_on date,
  grace_used_week date,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sc_results (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sc_sessions(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('quick-quiz','myth-fact','daily')),
  date_key date NOT NULL,
  score smallint NOT NULL CHECK (score >= 0),
  total smallint NOT NULL CHECK (total IN (5,7)),
  question_ids text[] NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  topic_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  weakest_topic text NOT NULL CHECK (weakest_topic IN ('food','movement','sleep','body')),
  hardest_believed_myth jsonb,
  hero_guess smallint NOT NULL CHECK (hero_guess BETWEEN 0 AND 100),
  selected_doubt text NOT NULL CHECK (selected_doubt IN ('safe','muscle-loss','regain','diabetes-only','for-me')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sc_challenges (
  id uuid PRIMARY KEY,
  sender_session_id uuid NOT NULL REFERENCES public.sc_sessions(id) ON DELETE CASCADE,
  sender_result_id uuid NOT NULL REFERENCES public.sc_results(id) ON DELETE RESTRICT,
  sender_first_name text CHECK (char_length(sender_first_name) BETWEEN 1 AND 40),
  joined_session_id uuid REFERENCES public.sc_sessions(id) ON DELETE SET NULL,
  joined_result_id uuid REFERENCES public.sc_results(id) ON DELETE SET NULL,
  question_ids text[] NOT NULL,
  mode text NOT NULL CHECK (mode IN ('quick-quiz','myth-fact')),
  state text NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting','completed')),
  habits_start_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (sender_session_id IS DISTINCT FROM joined_session_id)
);

CREATE TABLE IF NOT EXISTS public.sc_challenge_checkins (
  challenge_id uuid NOT NULL REFERENCES public.sc_challenges(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sc_sessions(id) ON DELETE CASCADE,
  habit_day smallint NOT NULL CHECK (habit_day BETWEEN 1 AND 3),
  checked_in boolean NOT NULL DEFAULT true,
  checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, session_id, habit_day)
);

CREATE TABLE IF NOT EXISTS public.sc_daily_completions (
  session_id uuid NOT NULL REFERENCES public.sc_sessions(id) ON DELETE CASCADE,
  date_key date NOT NULL,
  result_id uuid NOT NULL REFERENCES public.sc_results(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, date_key)
);

CREATE INDEX IF NOT EXISTS sc_results_session_created_idx ON public.sc_results (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sc_challenges_sender_idx ON public.sc_challenges (sender_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sc_challenges_joined_idx ON public.sc_challenges (joined_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sc_checkins_challenge_idx ON public.sc_challenge_checkins (challenge_id, habit_day);

ALTER TABLE public.sc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_challenge_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_daily_completions ENABLE ROW LEVEL SECURITY;

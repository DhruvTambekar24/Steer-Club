-- Additive care and analytics schema. Lead contact details remain server-only.
CREATE TABLE IF NOT EXISTS public.sc_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sc_sessions(id) ON DELETE CASCADE,
  event_name text NOT NULL CHECK (event_name IN (
    'hero_view','dial_locked','mode_selected','question_answered','game_completed',
    'wrapped_viewed','share_clicked','challenge_created','challenge_joined',
    'challenge_completed','care_opened','doubt_tapped','lead_started','lead_submitted',
    'scroll_depth'
  )),
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text CHECK (utm_source IS NULL OR char_length(utm_source) <= 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sc_leads (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL UNIQUE,
  session_id uuid NOT NULL REFERENCES public.sc_sessions(id) ON DELETE CASCADE,
  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 60),
  mobile text NOT NULL CHECK (mobile ~ '^[+]91[0-9]{10}$'),
  preferred_time text NOT NULL CHECK (preferred_time IN ('morning','afternoon','evening','no-preference')),
  language text NOT NULL CHECK (language IN ('en','hinglish')),
  note jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_text text NOT NULL CHECK (char_length(consent_text) BETWEEN 20 AND 500),
  consented_at timestamptz NOT NULL,
  utm_source text CHECK (utm_source IS NULL OR char_length(utm_source) <= 120),
  forwarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sc_events_created_name_idx ON public.sc_events (created_at DESC, event_name);
CREATE INDEX IF NOT EXISTS sc_events_session_created_idx ON public.sc_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sc_leads_created_idx ON public.sc_leads (created_at DESC);

ALTER TABLE public.sc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_leads ENABLE ROW LEVEL SECURITY;
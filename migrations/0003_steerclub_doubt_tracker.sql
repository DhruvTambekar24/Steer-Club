-- Add only two anonymous tracker fields to the existing session table.
-- Existing sessions keep empty lists and no user data is deleted.
ALTER TABLE public.sc_sessions
  ADD COLUMN IF NOT EXISTS saved_doubts text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.sc_sessions
  ADD COLUMN IF NOT EXISTS cleared_myths text[] NOT NULL DEFAULT '{}'::text[];

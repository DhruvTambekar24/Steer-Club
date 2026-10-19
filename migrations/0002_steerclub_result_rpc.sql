-- One atomic server-side result write for the shared Supabase project.
-- The function preserves RLS and is executable only by the server's service role.
CREATE OR REPLACE FUNCTION public.sc_save_game_result(
  p_session_id uuid,
  p_result_id uuid,
  p_mode text,
  p_date_key date,
  p_score smallint,
  p_total smallint,
  p_question_ids text[],
  p_answers jsonb,
  p_topic_scores jsonb,
  p_weakest_topic text,
  p_hardest_believed_myth jsonb,
  p_hero_guess smallint,
  p_selected_doubt text,
  p_utm jsonb DEFAULT '{}'::jsonb,
  p_challenge_id uuid DEFAULT NULL
)
RETURNS TABLE(saved_result_id uuid, current_streak smallint, challenge_completed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_last_daily_on date;
  v_grace_used_week date;
  v_week_start date;
  v_rows_inserted integer := 0;
  v_challenge public.sc_challenges%ROWTYPE;
  v_challenge_completed boolean := false;
BEGIN
  INSERT INTO public.sc_sessions (id, selected_doubt, hero_guess, utm)
  VALUES (p_session_id, p_selected_doubt, p_hero_guess, COALESCE(p_utm, '{}'::jsonb))
  ON CONFLICT (id) DO UPDATE
    SET selected_doubt = EXCLUDED.selected_doubt,
        hero_guess = EXCLUDED.hero_guess,
        utm = CASE WHEN EXCLUDED.utm = '{}'::jsonb THEN public.sc_sessions.utm ELSE EXCLUDED.utm END,
        updated_at = now();

  SELECT current_streak, best_streak, last_daily_on, grace_used_week
    INTO v_current_streak, v_best_streak, v_last_daily_on, v_grace_used_week
    FROM public.sc_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF p_challenge_id IS NOT NULL THEN
    SELECT * INTO v_challenge
      FROM public.sc_challenges
     WHERE id = p_challenge_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Challenge not found' USING ERRCODE = 'P0002';
    END IF;
    IF v_challenge.state <> 'waiting'
       OR v_challenge.sender_session_id = p_session_id
       OR v_challenge.mode <> p_mode
       OR v_challenge.question_ids IS DISTINCT FROM p_question_ids THEN
      RAISE EXCEPTION 'Challenge is not joinable with this round' USING ERRCODE = '23514';
    END IF;
  END IF;

  INSERT INTO public.sc_results (
    id, session_id, mode, date_key, score, total, question_ids, answers, topic_scores,
    weakest_topic, hardest_believed_myth, hero_guess, selected_doubt
  ) VALUES (
    p_result_id, p_session_id, p_mode, p_date_key, p_score, p_total, p_question_ids,
    COALESCE(p_answers, '[]'::jsonb), COALESCE(p_topic_scores, '{}'::jsonb),
    p_weakest_topic, p_hardest_believed_myth, p_hero_guess, p_selected_doubt
  );

  IF p_mode = 'daily' THEN
    INSERT INTO public.sc_daily_completions (session_id, date_key, result_id)
    VALUES (p_session_id, p_date_key, p_result_id)
    ON CONFLICT (session_id, date_key) DO NOTHING;
    GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

    IF v_rows_inserted > 0 THEN
      v_week_start := date_trunc('week', p_date_key::timestamp)::date;
      IF v_last_daily_on IS NULL THEN
        v_current_streak := 1;
      ELSIF v_last_daily_on = p_date_key THEN
        NULL;
      ELSIF v_last_daily_on = p_date_key - 1 THEN
        v_current_streak := v_current_streak + 1;
      ELSIF v_last_daily_on = p_date_key - 2 AND v_grace_used_week IS DISTINCT FROM v_week_start THEN
        v_current_streak := v_current_streak + 1;
        v_grace_used_week := v_week_start;
      ELSE
        v_current_streak := 1;
      END IF;

      v_best_streak := GREATEST(v_best_streak, v_current_streak);
      UPDATE public.sc_sessions
         SET current_streak = v_current_streak,
             best_streak = v_best_streak,
             last_daily_on = p_date_key,
             grace_used_week = v_grace_used_week,
             updated_at = now()
       WHERE id = p_session_id;
    END IF;
  END IF;

  IF p_challenge_id IS NOT NULL THEN
    UPDATE public.sc_challenges
       SET joined_session_id = p_session_id,
           joined_result_id = p_result_id,
           state = 'completed',
           habits_start_on = p_date_key,
           completed_at = now()
     WHERE id = p_challenge_id;
    v_challenge_completed := true;
  END IF;

  RETURN QUERY SELECT p_result_id, v_current_streak::smallint, v_challenge_completed;
END;
$$;

REVOKE ALL ON FUNCTION public.sc_save_game_result(uuid, uuid, text, date, smallint, smallint, text[], jsonb, jsonb, text, jsonb, smallint, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sc_save_game_result(uuid, uuid, text, date, smallint, smallint, text[], jsonb, jsonb, text, jsonb, smallint, text, jsonb, uuid) TO service_role;

-- Create an atomic function to update daily activity
-- This prevents race conditions when multiple attempts are recorded quickly

CREATE OR REPLACE FUNCTION public.increment_daily_activity(
  p_user_id uuid,
  p_is_correct boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_activity (user_id, activity_date, questions_attempted, questions_correct)
  VALUES (p_user_id, CURRENT_DATE, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    questions_attempted = daily_activity.questions_attempted + 1,
    questions_correct = daily_activity.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END;
END;
$$;

-- Add unique constraint if not exists (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_activity_user_date_unique'
  ) THEN
    ALTER TABLE daily_activity ADD CONSTRAINT daily_activity_user_date_unique UNIQUE (user_id, activity_date);
  END IF;
END $$;
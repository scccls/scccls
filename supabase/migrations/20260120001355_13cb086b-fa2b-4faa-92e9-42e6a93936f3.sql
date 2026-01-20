-- Create a security definer function to get leaderboard data
-- This safely exposes aggregated data without exposing raw user data

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE (
  username text,
  questions_attempted bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.username,
    COALESCE(SUM(da.questions_attempted), 0)::bigint as questions_attempted
  FROM profiles p
  LEFT JOIN daily_activity da ON da.user_id = p.user_id 
    AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY p.user_id, p.username
  ORDER BY questions_attempted DESC
  LIMIT 50;
$$;
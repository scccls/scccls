-- Add response_time_ms column to question_attempts table to track how long users take to answer each question
ALTER TABLE public.question_attempts 
ADD COLUMN response_time_ms integer DEFAULT NULL;
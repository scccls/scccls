-- Add coach email and auto-send fields to profiles
ALTER TABLE public.profiles
ADD COLUMN coach_email text,
ADD COLUMN auto_send_report boolean NOT NULL DEFAULT false;
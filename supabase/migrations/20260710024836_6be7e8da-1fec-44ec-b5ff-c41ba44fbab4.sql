ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo';
UPDATE public.team_activities SET status = 'done' WHERE done = true;
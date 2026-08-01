ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'membro',
  ADD COLUMN IF NOT EXISTS user_id uuid;
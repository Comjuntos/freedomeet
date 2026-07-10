ALTER TABLE public.team_activities
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
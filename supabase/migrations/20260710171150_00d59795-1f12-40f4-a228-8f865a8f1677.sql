ALTER TABLE public.competency_maps
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_competency_maps_member_id ON public.competency_maps(member_id);
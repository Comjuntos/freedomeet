CREATE TABLE public.competency_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams ON DELETE CASCADE,
  competency TEXT NOT NULL,
  why_critical TEXT,
  current_level SMALLINT NOT NULL DEFAULT 1,
  impact TEXT NOT NULL DEFAULT 'medio',
  how_evolve TEXT,
  responsible TEXT,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competency_maps TO authenticated;
GRANT ALL ON public.competency_maps TO service_role;

ALTER TABLE public.competency_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competency maps"
ON public.competency_maps FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_competency_maps_updated_at
BEFORE UPDATE ON public.competency_maps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
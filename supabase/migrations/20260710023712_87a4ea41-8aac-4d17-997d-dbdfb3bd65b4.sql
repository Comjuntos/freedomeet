CREATE TABLE public.team_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  due_date DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_activities TO authenticated;
GRANT ALL ON public.team_activities TO service_role;

ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their team activities"
ON public.team_activities FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_team_activities_updated_at
BEFORE UPDATE ON public.team_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
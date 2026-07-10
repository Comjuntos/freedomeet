CREATE TABLE public.meeting_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  room_id uuid,
  team_id uuid,
  title text NOT NULL,
  transcript text,
  minutes text,
  sentiment jsonb,
  dashboard jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_records TO authenticated;
GRANT ALL ON public.meeting_records TO service_role;

ALTER TABLE public.meeting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own meeting records"
ON public.meeting_records FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_meeting_records_updated_at
BEFORE UPDATE ON public.meeting_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
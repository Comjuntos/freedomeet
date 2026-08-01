CREATE TABLE public.scheduled_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  team_id UUID,
  room_id UUID,
  room_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  weekday SMALLINT NOT NULL DEFAULT 1,
  time_of_day TEXT NOT NULL DEFAULT '09:00',
  active BOOLEAN NOT NULL DEFAULT true,
  next_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_meetings TO authenticated;
GRANT ALL ON public.scheduled_meetings TO service_role;

ALTER TABLE public.scheduled_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own scheduled meetings"
ON public.scheduled_meetings FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_scheduled_meetings_updated_at
BEFORE UPDATE ON public.scheduled_meetings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
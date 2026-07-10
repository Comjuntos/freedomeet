import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

type SaveInput = {
  title: string;
  teamId: string | null;
  transcript?: string;
  minutes?: string;
  sentiment: Json;
  dashboard: Json;
  startedAt: string | null;
  endedAt: string | null;
};

function validate(input: unknown): SaveInput {
  const i = (input ?? {}) as Record<string, unknown>;
  if (typeof i.title !== "string" || !i.title.trim()) {
    throw new Error("Título da reunião é obrigatório.");
  }
  return {
    title: (i.title as string).trim(),
    teamId: typeof i.teamId === "string" && i.teamId ? i.teamId : null,
    transcript: typeof i.transcript === "string" ? i.transcript : undefined,
    minutes: typeof i.minutes === "string" ? i.minutes : undefined,
    sentiment: (i.sentiment ?? null) as Json,
    dashboard: (i.dashboard ?? null) as Json,
    startedAt: typeof i.startedAt === "string" ? i.startedAt : null,
    endedAt: typeof i.endedAt === "string" ? i.endedAt : null,
  };
}

export const saveMeetingRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("meeting_records").insert({
      owner_id: userId,
      title: data.title,
      team_id: data.teamId,
      transcript: data.transcript ?? null,
      minutes: data.minutes ?? null,
      sentiment: data.sentiment,
      dashboard: data.dashboard,
      started_at: data.startedAt,
      ended_at: data.endedAt,
    });
    if (error) throw new Error(`Falha ao salvar no histórico: ${error.message}`);
    return { ok: true };
  });

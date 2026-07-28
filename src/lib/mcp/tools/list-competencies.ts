import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_competencies",
  title: "Listar mapa de competências",
  description: "List mapped critical competencies, levels and evolution plans.",
  inputSchema: {
    team_id: z.string().optional().describe("Team UUID to filter by."),
    member_id: z.string().optional().describe("Team member UUID to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id, member_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let query = supabaseForUser(ctx)
      .from("competency_maps")
      .select("id, team_id, member_id, competency, impact, current_level, why_critical, how_evolve, responsible, deadline");
    if (team_id) query = query.eq("team_id", team_id);
    if (member_id) query = query.eq("member_id", member_id);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
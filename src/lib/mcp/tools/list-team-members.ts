import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_team_members",
  title: "Listar membros da equipe",
  description: "List members of a team, optionally filtered by team id.",
  inputSchema: {
    team_id: z.string().optional().describe("Team UUID. Omit to list members of every accessible team."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let query = supabaseForUser(ctx)
      .from("team_members")
      .select("id, team_id, full_name, role, email, activity");
    if (team_id) query = query.eq("team_id", team_id);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
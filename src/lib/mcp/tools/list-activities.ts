import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_activities",
  title: "Listar atividades",
  description: "List Kanban activities/tasks, optionally filtered by team or completion state.",
  inputSchema: {
    team_id: z.string().optional().describe("Team UUID to filter by."),
    done: z.boolean().optional().describe("Filter by completion state."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id, done }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let query = supabaseForUser(ctx)
      .from("team_activities")
      .select("id, team_id, member_id, title, status, done, due_date, created_at")
      .order("created_at", { ascending: false });
    if (team_id) query = query.eq("team_id", team_id);
    if (typeof done === "boolean") query = query.eq("done", done);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
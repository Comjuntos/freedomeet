import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_meetings",
  title: "Listar reuniões",
  description: "List recorded meetings with their AI minutes and analysis.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many meetings to return (default 10, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const take = Math.min(Math.max(limit ?? 10, 1), 50);
    const { data, error } = await supabaseForUser(ctx)
      .from("meeting_records")
      .select("id, title, room_id, team_id, started_at, ended_at, minutes, created_at")
      .order("created_at", { ascending: false })
      .limit(take);
    return error ? fail(error.message) : ok(data);
  },
});
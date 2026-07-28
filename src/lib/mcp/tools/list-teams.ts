import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_teams",
  title: "Listar equipes",
  description: "List the teams the signed-in user can access in FreeduMeet.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data, error } = await supabaseForUser(ctx)
      .from("teams")
      .select("id, name, created_at")
      .order("created_at", { ascending: true });
    return error ? fail(error.message) : ok(data);
  },
});
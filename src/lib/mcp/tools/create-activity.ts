import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "create_activity",
  title: "Criar atividade",
  description: "Create a Kanban activity/task for a team in FreeduMeet.",
  inputSchema: {
    team_id: z.string().describe("Team UUID the activity belongs to."),
    title: z.string().trim().min(1).describe("Short description of the task."),
    status: z.enum(["todo", "doing", "done"]).optional().describe("Kanban column. Defaults to todo."),
    member_id: z.string().optional().describe("Team member UUID to assign the task to."),
    due_date: z.string().optional().describe("Due date in YYYY-MM-DD format."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ team_id, title, status, member_id, due_date }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data, error } = await supabaseForUser(ctx)
      .from("team_activities")
      .insert({
        team_id,
        title,
        status: status ?? "todo",
        done: status === "done",
        member_id: member_id ?? null,
        due_date: due_date ?? null,
        owner_id: ctx.getUserId()!,
      })
      .select()
      .single();
    return error ? fail(error.message) : ok(data);
  },
});
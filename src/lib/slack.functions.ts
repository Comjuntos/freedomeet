import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

async function slackFetch(method: string, body: Record<string, unknown>) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!lovableKey || !slackKey) {
    throw new Error("Conexão com o Slack indisponível.");
  }
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": slackKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; error?: string; [k: string]: unknown };
  if (!res.ok || !data.ok) {
    throw new Error(`Slack: ${data.error ?? res.status}`);
  }
  return data;
}

export type SlackChannel = { id: string; name: string };

export const listSlackChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<SlackChannel[]> => {
    const channels: SlackChannel[] = [];
    let cursor = "";
    do {
      const page = (await slackFetch("conversations.list", {
        limit: 200,
        types: "public_channel",
        exclude_archived: true,
        ...(cursor ? { cursor } : {}),
      })) as {
        channels?: { id: string; name: string }[];
        response_metadata?: { next_cursor?: string };
      };
      for (const c of page.channels ?? []) channels.push({ id: c.id, name: c.name });
      cursor = page.response_metadata?.next_cursor ?? "";
    } while (cursor);
    return channels.sort((a, b) => a.name.localeCompare(b.name));
  });

export const sendToSlack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ channel: z.string().min(1).max(200), text: z.string().min(1).max(40000) }).parse(input),
  )
  .handler(async ({ data }) => {
    await slackFetch("chat.postMessage", {
      channel: data.channel,
      text: data.text,
      unfurl_links: false,
    });
    return { ok: true };
  });

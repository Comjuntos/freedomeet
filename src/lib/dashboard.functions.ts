import { createServerFn } from "@tanstack/react-start";

type DashboardInput = { transcript: string };

export type DashboardResult = {
  topics: { topic: string; mentions: number }[];
  keywords: { word: string; count: number }[];
};

function validate(input: unknown): DashboardInput {
  const i = (input ?? {}) as Partial<DashboardInput>;
  if (typeof i.transcript !== "string" || !i.transcript.trim()) {
    throw new Error("Transcrição vazia. Ative a transcrição durante a reunião.");
  }
  return { transcript: i.transcript };
}

export const analyzeDashboard = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<DashboardResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Você analisa a transcrição de uma reunião (português do Brasil). Responda APENAS um objeto JSON válido com este formato exato: {"topics":[{"topic":"assunto","mentions":numero}],"keywords":[{"word":"palavra","count":numero}]}. "topics": até 6 assuntos mais discutidos, ordenados por relevância, com uma estimativa de quantas vezes foram citados. "keywords": até 10 palavras-chave mais relevantes (ignore palavras vazias como artigos e preposições) com a contagem de ocorrências. Baseie-se somente na transcrição.',
          },
          { role: "user", content: `Transcrição:\n\n${data.transcript}` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falha na análise [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";

    let parsed: Partial<DashboardResult> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const topics = Array.isArray(parsed.topics)
      ? parsed.topics
          .filter((t) => t && typeof t.topic === "string")
          .map((t) => ({
            topic: t.topic,
            mentions: typeof t.mentions === "number" ? Math.max(0, Math.round(t.mentions)) : 0,
          }))
          .slice(0, 6)
      : [];

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter((k) => k && typeof k.word === "string")
          .map((k) => ({
            word: k.word,
            count: typeof k.count === "number" ? Math.max(0, Math.round(k.count)) : 0,
          }))
          .slice(0, 10)
      : [];

    return { topics, keywords };
  });

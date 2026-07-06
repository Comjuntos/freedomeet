import { createServerFn } from "@tanstack/react-start";

type SentimentInput = { transcript: string };

export type SentimentResult = {
  label: "positivo" | "neutro" | "negativo";
  score: number; // 0-100
  summary: string;
  emotions: string[];
};

function validate(input: unknown): SentimentInput {
  const i = (input ?? {}) as Partial<SentimentInput>;
  if (typeof i.transcript !== "string" || !i.transcript.trim()) {
    throw new Error("Transcrição vazia. Ative a transcrição durante a reunião.");
  }
  return { transcript: i.transcript };
}

export const analyzeSentiment = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<SentimentResult> => {
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
              'Você analisa o sentimento geral de uma reunião a partir da transcrição, em português do Brasil. Responda APENAS um objeto JSON válido com este formato exato: {"label":"positivo|neutro|negativo","score":0-100,"summary":"1-2 frases explicando o clima da reunião","emotions":["ate 4 emoções predominantes"]}. O score representa o quão positivo é o clima (0 muito negativo, 100 muito positivo). Baseie-se somente na transcrição.',
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

    let parsed: Partial<SentimentResult> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const label =
      parsed.label === "positivo" || parsed.label === "negativo"
        ? parsed.label
        : "neutro";
    const score =
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : 50;

    return {
      label,
      score,
      summary: typeof parsed.summary === "string" ? parsed.summary : "Sem dados suficientes.",
      emotions: Array.isArray(parsed.emotions)
        ? parsed.emotions.filter((e) => typeof e === "string").slice(0, 4)
        : [],
    };
  });

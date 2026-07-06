import { createServerFn } from "@tanstack/react-start";

type PunctuateInput = { text: string; lang?: string };

function validate(input: unknown): PunctuateInput {
  const i = (input ?? {}) as Partial<PunctuateInput>;
  if (typeof i.text !== "string") throw new Error("Invalid input");
  return { text: i.text, lang: typeof i.lang === "string" ? i.lang : undefined };
}

export const punctuateText = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.text.trim()) return { text: "" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content:
              "You clean up raw speech-to-text transcripts. Add correct punctuation, capitalization, and accents; fix obvious recognition errors and spacing; keep the SAME language and the SAME words/meaning. Do not translate, summarize, add, or remove content. Reply with ONLY the corrected text, no quotes or notes.",
          },
          {
            role: "user",
            content: `${data.lang ? `Language: ${data.lang}\n\n` : ""}Text: ${data.text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Punctuation failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { text: json.choices?.[0]?.message?.content?.trim() || data.text };
  });

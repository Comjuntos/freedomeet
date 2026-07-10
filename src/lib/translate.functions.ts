import { createServerFn } from "@tanstack/react-start";

type TranslateInput = { text: string; target: string };

function validate(input: unknown): TranslateInput {
  const i = input as Partial<TranslateInput>;
  if (!i || typeof i.text !== "string" || typeof i.target !== "string") {
    throw new Error("Invalid input");
  }
  return { text: i.text.slice(0, 20000), target: i.target.slice(0, 40) };
}

export const translateText = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.text.trim()) return { translation: "" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content:
              "You are a real-time meeting caption translator. Translate the user's text into the requested target language. Reply with ONLY the translation, no notes, no quotes.",
          },
          {
            role: "user",
            content: `Target language: ${data.target}\n\nText: ${data.text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Translation failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { translation: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });
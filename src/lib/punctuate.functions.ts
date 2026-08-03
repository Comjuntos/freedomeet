import { createServerFn } from "@tanstack/react-start";

type PunctuateInput = { text: string; lang?: string };

function validate(input: unknown): PunctuateInput {
  const i = (input ?? {}) as Partial<PunctuateInput>;
  if (typeof i.text !== "string") throw new Error("Invalid input");
  return { text: i.text.slice(0, 20000), lang: typeof i.lang === "string" ? i.lang.slice(0, 20) : undefined };
}

export const punctuateText = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    // Retorna o texto original para não bloquear a transcrição em tempo real
    return { text: data.text };
  });

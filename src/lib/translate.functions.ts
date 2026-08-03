import { createServerFn } from "@tanstack/react-start";

type TranslateInput = { text: string; target: string };

function validate(input: unknown): TranslateInput {
  const i = input as Partial<TranslateInput>;
  if (!i || typeof i.text !== "string" || typeof i.target !== "string") {
    throw new Error("Invalid input");
  }
  return { text: i.text.slice(0, 20000), target: i.target.slice(0, 10) };
}

export const translateText = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    if (!data.text.trim()) return { translation: "" };

    const encodedText = encodeURIComponent(data.text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${data.target}&dt=t&q=${encodedText}`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Translation failed [${res.status}]`);
      }
      const json = await res.json();
      
      let translation = "";
      if (Array.isArray(json) && Array.isArray(json[0])) {
        json[0].forEach((sentenceParts: any) => {
          if (sentenceParts && sentenceParts[0]) {
            translation += sentenceParts[0];
          }
        });
      }
      
      return { translation: translation.trim() };
    } catch (e: any) {
      console.error("Google Translate error:", e);
      return { translation: `[Erro: ${e.message}]` };
    }
  });
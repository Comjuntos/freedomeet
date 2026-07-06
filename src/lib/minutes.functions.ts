import { createServerFn } from "@tanstack/react-start";

type MinutesInput = { transcript: string; title?: string; template?: string };

const TEMPLATES: Record<string, string> = {
  formal:
    "Gere uma ATA DE REUNIÃO formal e corporativa, com linguagem impessoal e estruturada.",
  executiva:
    "Gere uma ATA EXECUTIVA concisa, focada em decisões, resultados e próximos passos.",
  detalhada:
    "Gere uma ATA DETALHADA que registra cronologicamente os pontos discutidos, com bastante contexto.",
};

function validate(input: unknown): MinutesInput {
  const i = (input ?? {}) as Partial<MinutesInput>;
  if (typeof i.transcript !== "string" || !i.transcript.trim()) {
    throw new Error("Transcrição vazia. Ative a transcrição durante a reunião.");
  }
  return {
    transcript: i.transcript,
    title: typeof i.title === "string" ? i.title : undefined,
    template: typeof i.template === "string" ? i.template : "formal",
  };
}

export const generateMinutes = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const style = TEMPLATES[data.template ?? "formal"] ?? TEMPLATES.formal;
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que redige atas de reunião profissionais em português do Brasil. ${style}

Responda APENAS em Markdown, sem blocos de código. Use esta estrutura:
# Ata de Reunião${data.title ? `: ${data.title}` : ""}
**Data:** ${today}

## Participantes
(liste os participantes se identificáveis, senão "Não identificados")

## Pauta / Assuntos Tratados
(tópicos discutidos em bullets)

## Discussões e Decisões
(resumo das decisões tomadas)

## Ações e Responsáveis
(tabela markdown: Ação | Responsável | Prazo)

## Próximos Passos
(bullets)

Baseie-se somente na transcrição fornecida. Não invente informações não presentes.`,
          },
          {
            role: "user",
            content: `Transcrição da reunião:\n\n${data.transcript}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falha ao gerar ata [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { minutes: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });

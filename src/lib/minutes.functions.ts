import { createServerFn } from "@tanstack/react-start";

type MinutesInput = {
  transcript: string;
  title?: string;
  template?: string;
  members?: string[];
  startedAt?: string;
};

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
    transcript: i.transcript.slice(0, 200000),
    title: typeof i.title === "string" ? i.title : undefined,
    template: typeof i.template === "string" ? i.template : "formal",
    members: Array.isArray(i.members)
      ? i.members.filter((m): m is string => typeof m === "string" && m.trim() !== "")
      : undefined,
    startedAt: typeof i.startedAt === "string" ? i.startedAt : undefined,
  };
}

export const generateMinutes = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {

    const style = TEMPLATES[data.template ?? "formal"] ?? TEMPLATES.formal;
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const membersList =
      data.members && data.members.length > 0
        ? data.members.map((m) => `- ${m}`).join("\n")
        : "Não informados";
    const startedInfo = data.startedAt || "Não informado";

    const res = await fetch("https://ollama.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 026e670c37c34e89846c62ffb045ed39.5HQ8ryBDGGhtvbuHh8-DOHbp",
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que redige atas de reunião profissionais em português do Brasil. ${style}

IMPORTANTE: A transcrição pode vir sem acentuação e com erros de reconhecimento de voz. Reescreva todo o conteúdo em português do Brasil correto, com acentuação, pontuação, maiúsculas e ortografia adequadas. Nunca deixe palavras sem acento (ex.: "reuniao" → "reunião", "decisao" → "decisão", "nao" → "não").

Responda APENAS em Markdown, sem blocos de código. Use esta estrutura:
# Ata de Reunião${data.title ? `: ${data.title}` : ""}
**Data:** ${today}
**Início da reunião:** ${startedInfo}

## Participantes
(use exatamente a lista de membros informada abaixo, com os nomes completos)
${membersList}

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

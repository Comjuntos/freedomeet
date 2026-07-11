import { createServerFn } from "@tanstack/react-start";

type ExtractInput = {
  transcript: string;
  members?: string[];
};

export type ExtractedAction = {
  title: string;
  assignee: string;
  dueDate: string | null;
};

function validate(input: unknown): ExtractInput {
  const i = (input ?? {}) as Partial<ExtractInput>;
  if (typeof i.transcript !== "string" || !i.transcript.trim()) {
    throw new Error("Conteúdo vazio. Gere a ata ou ative a transcrição primeiro.");
  }
  return {
    transcript: i.transcript.slice(0, 200000),
    members: Array.isArray(i.members)
      ? i.members.filter((m): m is string => typeof m === "string" && m.trim() !== "")
      : undefined,
  };
}

export const extractActions = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<{ actions: ExtractedAction[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const today = new Date().toISOString().slice(0, 10);
    const membersList =
      data.members && data.members.length > 0
        ? data.members.join(", ")
        : "não informados";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Você extrai ITENS DE AÇÃO (tarefas / follow-ups) de uma reunião em português do Brasil. A data de hoje é ${today}. Membros da equipe: ${membersList}.

Responda APENAS um objeto JSON válido no formato exato:
{"actions":[{"title":"descrição da tarefa","assignee":"nome do responsável ou vazio","dueDate":"YYYY-MM-DD ou vazio"}]}

Regras:
- "title": ação clara e objetiva, começando com um verbo (ex.: "Enviar proposta ao cliente"). Corrija acentuação e ortografia.
- "assignee": use EXATAMENTE um dos nomes da lista de membros quando a tarefa tiver responsável identificável; caso contrário, deixe "".
- "dueDate": se houver prazo mencionado, converta para data absoluta YYYY-MM-DD com base na data de hoje; caso contrário, deixe "".
- Extraia apenas tarefas reais decididas na reunião. Se não houver nenhuma, retorne {"actions":[]}.`,
          },
          { role: "user", content: `Conteúdo da reunião:\n\n${data.transcript}` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falha ao extrair ações [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";

    let parsed: { actions?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const actions: ExtractedAction[] = Array.isArray(parsed.actions)
      ? parsed.actions
          .filter(
            (a): a is Record<string, unknown> =>
              !!a && typeof (a as Record<string, unknown>).title === "string",
          )
          .map((a) => {
            const title = String(a.title).trim();
            const assignee = typeof a.assignee === "string" ? a.assignee.trim() : "";
            const due = typeof a.dueDate === "string" ? a.dueDate.trim() : "";
            const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null;
            return { title, assignee, dueDate };
          })
          .filter((a) => a.title !== "")
      : [];

    return { actions };
  });

import { createServerFn } from "@tanstack/react-start";

type Segment = { t: number; text: string };
type ChaptersInput = { segments: Segment[] };

export type Chapter = {
  title: string;
  start: number; // segundos desde o início da reunião
  summary: string;
  highlights: string[];
};

export type ChaptersResult = { chapters: Chapter[] };

function validate(input: unknown): ChaptersInput {
  const i = (input ?? {}) as Partial<ChaptersInput>;
  const segments = Array.isArray(i.segments)
    ? i.segments
        .filter(
          (s): s is Segment =>
            !!s && typeof s.text === "string" && s.text.trim() !== "",
        )
        .map((s) => ({
          t: typeof s.t === "number" && s.t >= 0 ? Math.floor(s.t) : 0,
          text: s.text.slice(0, 2000),
        }))
        .slice(0, 4000)
    : [];
  if (segments.length === 0) {
    throw new Error("Transcrição vazia. Ative a transcrição durante a reunião.");
  }
  return { segments };
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const detectChapters = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<ChaptersResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const transcript = data.segments
      .map((s) => `[${fmt(s.t)}] ${s.text}`)
      .join("\n")
      .slice(0, 200000);

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
              'Você segmenta a transcrição de uma reunião (português do Brasil) em capítulos temáticos, estilo "highlights". Cada linha da transcrição começa com um timestamp [mm:ss] relativo ao início da reunião. Responda APENAS um objeto JSON válido no formato exato: {"chapters":[{"title":"Título curto do bloco","start":"mm:ss","summary":"Resumo de 1-2 frases do que foi discutido","highlights":["ponto-chave 1","ponto-chave 2"]}]}. Regras: identifique de 3 a 8 blocos temáticos na ordem em que ocorreram; "start" deve ser o timestamp exato em que o assunto começa (copie do trecho correspondente); "title" objetivo com no máximo 6 palavras; "summary" claro em português correto e acentuado; "highlights" com 1 a 3 pontos essenciais. Baseie-se somente na transcrição.',
          },
          { role: "user", content: `Transcrição:\n\n${transcript}` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falha ao detectar capítulos [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";

    let parsed: { chapters?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const toSeconds = (v: unknown): number => {
      if (typeof v === "number" && v >= 0) return Math.floor(v);
      if (typeof v === "string") {
        const m = v.match(/(\d+):(\d{1,2})/);
        if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        const n = parseInt(v, 10);
        if (!Number.isNaN(n)) return n;
      }
      return 0;
    };

    const chapters: Chapter[] = Array.isArray(parsed.chapters)
      ? (parsed.chapters as Record<string, unknown>[])
          .filter((c) => c && typeof c.title === "string")
          .map((c) => ({
            title: String(c.title),
            start: toSeconds(c.start),
            summary: typeof c.summary === "string" ? c.summary : "",
            highlights: Array.isArray(c.highlights)
              ? (c.highlights as unknown[])
                  .filter((h): h is string => typeof h === "string" && h.trim() !== "")
                  .slice(0, 3)
              : [],
          }))
          .sort((a, b) => a.start - b.start)
          .slice(0, 8)
      : [];

    return { chapters };
  });

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Video,
  Captions,
  Languages,
  FileText,
  KanbanSquare,
  Target,
  ListChecks,
  Search,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

type Step = { title: string; detail: string };
type Chapter = {
  id: string;
  icon: typeof Video;
  title: string;
  summary: string;
  steps: Step[];
};

const CHAPTERS: Chapter[] = [
  {
    id: "reuniao",
    icon: Video,
    title: "Criar e entrar em uma reunião",
    summary: "Comece uma sala em segundos ou entre com um código.",
    steps: [
      { title: "Nova reunião", detail: "Na página inicial, clique em “Nova reunião”. Você entra como anfitrião da sala." },
      { title: "Entrar com código", detail: "Cole o código recebido no campo de entrada e confirme para participar." },
      { title: "Convidar pessoas", detail: "Compartilhe o link da sala — quem tiver o link consegue entrar." },
    ],
  },
  {
    id: "transcricao",
    icon: Captions,
    title: "Transcrição ao vivo",
    summary: "A fala vira texto em tempo real, com pontuação natural.",
    steps: [
      { title: "Ativar legendas", detail: "Dentro da sala, abra o painel de ferramentas e ligue a transcrição." },
      { title: "Acompanhar", detail: "O texto aparece em blocos conforme a conversa avança e fica salvo na sessão." },
    ],
  },
  {
    id: "traducao",
    icon: Languages,
    title: "Tradução em tempo real",
    summary: "Legendas traduzidas na hora para vários idiomas.",
    steps: [
      { title: "Escolher idioma", detail: "Selecione o idioma de destino no painel de ferramentas." },
      { title: "Ler traduzido", detail: "As legendas passam a exibir a versão traduzida sem interromper a reunião." },
    ],
  },
  {
    id: "ata",
    icon: FileText,
    title: "Ata e capítulos gerados por IA",
    summary: "Resumo profissional e divisão temática da reunião.",
    steps: [
      { title: "Gerar ata", detail: "Ao final, clique em “Gerar ata” e escolha o modelo (formal, executivo ou detalhado)." },
      { title: "Capítulos & highlights", detail: "A IA divide a transcrição em blocos temáticos com marcações de tempo." },
      { title: "Salvar histórico", detail: "A ata fica registrada e pode ser consultada depois no painel." },
    ],
  },
  {
    id: "kanban",
    icon: KanbanSquare,
    title: "Kanban de atividades",
    summary: "Transforme decisões da reunião em tarefas com responsáveis.",
    steps: [
      { title: "Enviar ações ao Kanban", detail: "Depois da ata, use “Enviar ações para o Kanban” e escolha a equipe." },
      { title: "Arrastar cartões", detail: "No painel, mova cartões entre A fazer, Em andamento e Concluído." },
      { title: "Editar", detail: "Clique no cartão para ajustar título, responsável e prazo." },
    ],
  },
  {
    id: "competencias",
    icon: Target,
    title: "Mapa de Competências",
    summary: "Mapeie habilidades da equipe e acompanhe a evolução.",
    steps: [
      { title: "Cadastrar competência", detail: "Informe a competência, por que é crítica, nível atual, impacto e plano de evolução." },
      { title: "Vincular ao membro", detail: "Associe cada competência a um membro da equipe para visões individuais." },
      { title: "Painel ao vivo", detail: "Veja gráficos de barras, pizza e radar em “Competências ao vivo”." },
    ],
  },
  {
    id: "gestor",
    icon: ListChecks,
    title: "Visão do gestor",
    summary: "Produtividade por pessoa e exportação de dados.",
    steps: [
      { title: "Resumo por pessoa", detail: "Acompanhe tarefas abertas, concluídas e atrasadas de cada membro." },
      { title: "Exportar CSV", detail: "Baixe os dados consolidados para análises externas." },
    ],
  },
];

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual interativo — FreeduMeet" },
      {
        name: "description",
        content:
          "Guia passo a passo do FreeduMeet: reuniões, transcrição, tradução, atas por IA, Kanban e mapa de competências.",
      },
      { property: "og:title", content: "Manual interativo — FreeduMeet" },
      {
        property: "og:description",
        content: "Aprenda a usar cada recurso do FreeduMeet em um guia interativo por capítulos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManualPage,
});

function ManualPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(CHAPTERS[0].id);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const chapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHAPTERS;
    return CHAPTERS.filter((c) =>
      [c.title, c.summary, ...c.steps.flatMap((s) => [s.title, s.detail])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const progress = Math.round((Object.values(done).filter(Boolean).length / CHAPTERS.length) * 100);

  return (
    <div className="aurora-bg min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Manual interativo</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Um guia prático por capítulos. Abra cada tópico, siga os passos e marque como concluído.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Seu progresso</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar no manual…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-6 space-y-3 pb-16">
          {chapters.map((c) => {
            const Icon = c.icon;
            const isOpen = open === c.id;
            return (
              <section key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur">
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{c.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{c.summary}</span>
                  </span>
                  {done[c.id] && (
                    <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline">
                      Concluído
                    </span>
                  )}
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 py-4">
                    <ol className="space-y-3">
                      {c.steps.map((s, i) => (
                        <li key={s.title} className="flex gap-3">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{s.title}</p>
                            <p className="text-sm text-muted-foreground">{s.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <button
                      onClick={() => setDone((d) => ({ ...d, [c.id]: !d[c.id] }))}
                      className="mt-4 inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      {done[c.id] ? "Desmarcar" : "Marcar como concluído"}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
          {chapters.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum tópico encontrado para “{query}”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

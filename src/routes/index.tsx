import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { PLAN_LIST } from "@/lib/plans";
import logoUrl from "@/assets/freedumeet-logo.png.asset.json";
import logoTransparentUrl from "@/assets/freedumeet-logo-transparent.png.asset.json";
import {
  Video,
  Keyboard,
  HelpCircle,
  Settings,
  Captions,
  Languages,
  FileText,
  ShieldCheck,
  KanbanSquare,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  BarChart3,
  Check,
} from "lucide-react";

/** Etapas do fluxo comercial exibidas na seção "Como funciona". */
const STEPS: { icon: typeof Video; title: string; desc: string }[] = [
  {
    icon: Video,
    title: "1. Abra a sala",
    desc: "Um clique em Nova reunião gera um link seguro. Sem instalar nada, sem fricção para o convidado.",
  },
  {
    icon: Captions,
    title: "2. A IA acompanha",
    desc: "Transcrição, tradução e capítulos acontecem enquanto vocês conversam.",
  },
  {
    icon: KanbanSquare,
    title: "3. Saia com decisões",
    desc: "Ata pronta e tarefas já no Kanban da equipe, com responsável e prazo.",
  },
];

/** Resultados de negócio usados como prova de valor no topo da página. */
const OUTCOMES: { icon: typeof Clock; k: string; v: string }[] = [
  { icon: Clock, k: "-70%", v: "tempo escrevendo atas" },
  { icon: BarChart3, k: "20%", v: "mais barato que o mercado" },
  { icon: Users, k: "100%", v: "das decisões viram tarefas" },
];

/**
 * Recursos exibidos em cartões compactos: descrições curtas para que a seção
 * ocupe pouco espaço e o destaque da página fique nos planos de assinatura.
 */
const FEATURES = [
  { icon: Captions, title: "Transcrição ao vivo", desc: "Fala vira texto na hora." },
  { icon: Languages, title: "Tradução em tempo real", desc: "Legendas em 5+ idiomas." },
  { icon: FileText, title: "Ata por IA", desc: "Resumo pronto ao final." },
  { icon: KanbanSquare, title: "Kanban da equipe", desc: "Decisões viram tarefas." },
  { icon: ShieldCheck, title: "Vídeo HD seguro", desc: "Acesso por token assinado." },
];

const PLANS = PLAN_LIST;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreeduMeet — Videoconferência aberta" },
      {
        name: "description",
        content:
          "Crie ou entre em reuniões de vídeo com câmera, áudio, chat e compartilhamento de tela. Rápido, seguro e gratuito.",
      },
    ],
  }),
  component: Index,
});

function randomRoom() {
  const words = ["azul", "sol", "nuvem", "onda", "pico", "rio", "lua", "vale"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function Index() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();

  // Se o usuário já estiver logado, carrega o painel automaticamente.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        navigate({ to: "/app" });
      }
    });
  }, [navigate]);

  const createMeeting = () => {
    const roomId = randomRoom();
    // Marca quem criou a sala como administrador (host) desta reunião.
    sessionStorage.setItem(`freedomeet-host-${roomId}`, "1");
    navigate({ to: "/room/$roomId", params: { roomId } });
  };

  const joinMeeting = () => {
    const room = code.trim().replace(/\s+/g, "-");
    if (room) navigate({ to: "/room/$roomId", params: { roomId: room } });
  };

  const handleSubscribe = (priceId: string) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    openCheckout({
      priceId,
      quantity: 1,
      customerEmail: user.email,
      customData: { userId: user.id },
      successUrl: `${window.location.origin}/app?checkout=success`,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <img src={logoUrl.url} alt="FreeduMeet" className="size-8 shrink-0 rounded-lg object-cover sm:size-9" />
          <span className="truncate font-display text-xl font-normal tracking-tight text-muted-foreground sm:text-[1.375rem]">
            FreeduMeet
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="mr-2 hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button className="hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary sm:inline-flex" aria-label="Ajuda">
            <HelpCircle className="size-5" />
          </button>
          <button className="hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary sm:inline-flex" aria-label="Configurações">
            <Settings className="size-5" />
          </button>
          <Link
            to="/auth"
            className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
          >
            Entrar
          </Link>
          <Link
            to="/manual"
            className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
          >
            Manual
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-none transition-shadow hover:shadow-[var(--shadow-glow)]"
          >
            Painel
          </Link>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {/* Brilho sutil de fundo — reforça o ar sofisticado sem poluir o conteúdo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] size-[36rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-primary)_20%,transparent)_0%,transparent_65%)] blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[1.05fr_0.95fr]">
        <div className="w-full min-w-0 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Reuniões com IA em português
          </span>
          <h1 className="mt-5 font-display text-[2.25rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[2.9rem] md:text-[3.4rem]">
            Reuniões que terminam com{" "}
            <span className="bg-[linear-gradient(100deg,var(--color-primary),color-mix(in_oklab,var(--color-primary)_45%,var(--color-foreground)))] bg-clip-text text-transparent">
              decisões, não com anotações
            </span>
          </h1>
          <p className="mt-5 text-base font-normal text-muted-foreground sm:text-lg">
            Vídeo HD, transcrição ao vivo, ata pronta e tarefas no Kanban da equipe —
            tudo em uma plataforma só, por até 20% menos que as alternativas.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              onClick={createMeeting}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--shadow-elegant)]"
            >
              <Video className="size-5" />
              Nova reunião
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-input px-4 py-2.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <Keyboard className="size-5 text-muted-foreground" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                  placeholder="Digite um código ou link"
                  className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:w-44"
                />
              </div>
              <button
                onClick={joinMeeting}
                disabled={!code.trim()}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/8 disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-transparent"
              >
                Participar
              </button>
            </div>
          </div>

          <hr className="mt-8 border-border" />
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {OUTCOMES.map((s) => (
              <div key={s.v} className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <dt className="font-display text-xl font-normal text-foreground">{s.k}</dt>
                  <dd className="text-xs text-muted-foreground">{s.v}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            Comece grátis hoje ·{" "}
            <a className="text-primary hover:underline" href="#planos">
              ver planos e preços
            </a>
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col items-center justify-center overflow-hidden text-center">
          <div className="relative flex size-64 shrink-0 items-center justify-center sm:size-80">
            {/* 3D blue halo */}
            <div className="absolute size-60 rounded-full bg-[radial-gradient(circle_at_30%_25%,var(--color-primary)_0%,transparent_62%)] opacity-25 blur-2xl sm:size-76" />
            <div className="absolute size-56 rounded-full bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_70%)] shadow-[inset_0_-14px_30px_color-mix(in_oklab,var(--color-primary)_28%,transparent),0_30px_60px_-20px_color-mix(in_oklab,var(--color-primary)_45%,transparent)] sm:size-72" />
            <div className="absolute size-44 rounded-full border border-primary/20 sm:size-60" />

            {/* logo core — glossy 3D sphere */}
            <div className="relative flex size-40 items-center justify-center rounded-full bg-[linear-gradient(160deg,var(--color-card),color-mix(in_oklab,var(--color-primary)_12%,var(--color-card)))] shadow-[inset_0_2px_2px_rgba(255,255,255,0.9),inset_0_-18px_28px_-12px_color-mix(in_oklab,var(--color-primary)_40%,transparent),0_24px_44px_-16px_color-mix(in_oklab,var(--color-primary)_50%,transparent)] sm:size-52">
              <span className="pointer-events-none absolute inset-x-6 top-3 h-10 rounded-full bg-white/70 blur-md sm:inset-x-8 sm:top-4 sm:h-12" />
              <img
                src={logoTransparentUrl.url}
                alt="FreeduMeet"
                className="relative size-28 object-contain drop-shadow-[0_8px_14px_color-mix(in_oklab,var(--color-primary)_35%,transparent)] sm:size-36"
              />
            </div>
          </div>
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-[var(--shadow-elegant)]">
            <h2 className="font-display text-base font-medium">O que já vem incluso</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {[
                "Link de convite instantâneo, sem instalação",
                "Transcrição e tradução ao vivo",
                "Ata profissional gerada por IA",
                "Tarefas enviadas direto ao Kanban",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        </div>
      </main>

      <section className="border-t border-border bg-secondary/40 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <span className="text-sm font-medium text-primary">Como funciona</span>
          <h2 className="mt-2 font-display text-2xl font-normal md:text-3xl">
            Do convite à decisão em três passos
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={createMeeting}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--shadow-elegant)]"
          >
            Testar agora, é grátis
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>

      <section className="border-t border-border px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <span className="text-sm font-medium text-primary">Recursos</span>
          <h2 className="mt-2 font-display text-2xl font-normal md:text-3xl">
            Por que escolher o FreeduMeet
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Muito além de uma chamada de vídeo: recursos de IA que economizam
            seu tempo em cada reunião.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-display text-base font-medium">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-border px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <span className="text-sm font-medium text-primary">Planos</span>
          <h2 className="mt-2 font-display text-2xl font-normal md:text-3xl">Planos e assinaturas</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Preços pensados para o mercado brasileiro, sempre cerca de 20% mais baratos
            que as principais plataformas de videoconferência.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border bg-card p-7 transition-shadow hover:shadow-[var(--shadow-elegant)] ${
                  plan.highlight ? "border-primary shadow-[var(--shadow-glow)]" : "border-border"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Mais popular
                  </span>
                )}
                <h3 className="font-display text-lg font-medium">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-normal">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => (plan.priceId ? handleSubscribe(plan.priceId) : createMeeting())}
                  disabled={checkoutLoading}
                  className={`mt-7 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border text-primary hover:bg-primary/8"
                  }`}
                >
                  {plan.price === "R$ 0" ? "Começar grátis" : `Assinar ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Valores mensais em reais. Assinaturas anuais têm desconto adicional.
          </p>
        </div>
      </section>

      <section className="border-t border-border px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/20 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--color-primary)_12%,var(--color-card)),var(--color-card))] p-8 text-center shadow-[var(--shadow-elegant)] sm:p-12">
          <h2 className="font-display text-2xl font-normal md:text-3xl">
            Pronto para a próxima reunião produtiva?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Crie uma sala agora mesmo, sem cartão de crédito. Faça o upgrade quando a
            equipe quiser relatórios, competências e reuniões ilimitadas.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={createMeeting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)] sm:w-auto"
            >
              <Video className="size-4" />
              Criar reunião grátis
            </button>
            <a
              href="#planos"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/8 sm:w-auto"
            >
              Comparar planos
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoUrl.url} alt="FreeduMeet" className="size-7 rounded-lg object-cover" />
            <span className="font-display font-semibold text-foreground">FreeduMeet</span>
          </div>
          <p className="text-center sm:text-right">© {new Date().getFullYear()} FreeduMeet — Videoconferência com soberania nacional.</p>
        </div>
      </footer>
    </div>
  );
}

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
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
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
        {/* Camadas de fundo: malha técnica + blobs de aurora em movimento lento. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-mesh" />
        <div
          aria-hidden
          className="blob pointer-events-none -top-32 right-[-8%] size-[34rem] bg-[color-mix(in_oklab,var(--color-primary)_28%,transparent)] opacity-60"
        />
        <div
          aria-hidden
          className="blob pointer-events-none -left-24 top-40 size-[26rem] bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)] opacity-50 [animation-delay:-6s]"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[1.05fr_0.95fr]">
        <div className="rise w-full min-w-0 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
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
              className="sheen inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_14px_30px_-14px_color-mix(in_oklab,var(--color-primary)_80%,transparent)] transition-transform hover:-translate-y-0.5"
            >
              <Video className="relative z-10 size-5" />
              <span className="relative z-10">Nova reunião</span>
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

        <div className="rise flex w-full min-w-0 flex-col items-center justify-center overflow-hidden text-center [animation-delay:150ms]">
          <div className="float-slow relative flex size-64 shrink-0 items-center justify-center sm:size-80">
            {/* anéis orbitais girando devagar */}
            <div aria-hidden className="spin-slow absolute size-64 rounded-full border border-dashed border-primary/25 sm:size-80" />
            <div aria-hidden className="spin-slow-rev absolute size-52 rounded-full border border-primary/15 sm:size-68" />
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
          <div className="gradient-ring lift mt-8 w-full max-w-sm rounded-2xl p-6 text-left shadow-[var(--shadow-elegant)]">
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

      {/* Faixa em movimento contínuo com os diferenciais do produto. */}
      <div className="overflow-hidden border-y border-border bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-primary)_10%,var(--color-background)),var(--color-background),color-mix(in_oklab,var(--color-primary)_10%,var(--color-background)))] py-3">
        <div className="marquee-track gap-10 pr-10">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={dup === 1}>
              {FEATURES.map((f) => (
                <span
                  key={f.title}
                  className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground"
                >
                  <f.icon className="size-4 text-primary" />
                  {f.title}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden border-t border-border bg-secondary/40 px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                Como funciona
              </span>
              <h2 className="mt-2 font-display text-xl font-normal tracking-[-0.02em] sm:text-2xl">
                Do convite à decisão em{" "}
                <span className="bg-[linear-gradient(100deg,var(--color-primary),color-mix(in_oklab,var(--color-primary)_45%,var(--color-foreground)))] bg-clip-text text-transparent">
                  três passos
                </span>
              </h2>
            </div>
            <p className="max-w-sm text-xs text-muted-foreground sm:text-right sm:text-sm">
              Sem treinamento. A equipe entra, conversa e sai com o próximo passo
              definido.
            </p>
          </div>

          <ol className="relative mt-8 grid gap-4 md:grid-cols-3">
            {/* trilha 3D conectando os passos no desktop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[12%] top-[2.6rem] hidden h-0.5 md:block"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-primary) 55%, transparent) 10%, color-mix(in oklab, var(--color-primary) 55%, transparent) 90%, transparent)",
              }}
            />
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="group relative"
                style={{ perspective: "900px" }}
              >
                <div
                  className="relative flex flex-col rounded-2xl border border-border bg-card/90 p-4 pt-8 shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_44px_-20px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateX(2deg) rotateY(0deg) translateZ(0)",
                  }}
                >
                  {/* número 3D flutuante */}
                  <span
                    className="absolute -top-3 left-4 flex size-7 items-center justify-center rounded-xl bg-primary text-[10px] font-bold text-primary-foreground shadow-[0_12px_24px_-10px_color-mix(in_oklab,var(--color-primary)_95%,transparent)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
                    style={{ transform: "translateZ(18px)" }}
                  >
                    {i + 1}
                  </span>
                  {/* ponto de conexão na trilha */}
                  <span
                    aria-hidden
                    className="absolute -top-[0.6rem] left-1/2 hidden size-2.5 -translate-x-1/2 rounded-full border-2 border-background bg-primary shadow-[0_0_12px_color-mix(in_oklab,var(--color-primary)_80%,transparent)] md:block"
                  />

                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:-translate-y-0.5">
                      <s.icon className="size-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-medium">
                        {s.title.replace(/^\d+\.\s*/, "")}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={createMeeting}
              className="sheen inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-[0_12px_24px_-12px_color-mix(in_oklab,var(--color-primary)_80%,transparent)] transition-transform hover:-translate-y-0.5"
            >
              <span className="relative z-10">Testar agora</span>
              <ArrowRight className="relative z-10 size-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">
              Sem cartão · sala pronta em segundos
            </span>
          </div>
        </div>
      </section>

      <section
        id="planos"
        className="border-t border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_7%,var(--color-background)),var(--color-background))] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-sm font-medium text-primary">Planos</span>
            <h2 className="mt-2 font-display text-3xl font-normal md:text-4xl">
              Escolha o plano da sua equipe
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Preços pensados para o mercado brasileiro, sempre cerca de 20% mais baratos
              que as principais plataformas de videoconferência.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`lift relative flex flex-col rounded-2xl border bg-card p-7 ${
                  plan.highlight
                    ? "border-primary/60 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_8%,var(--color-card)),var(--color-card))] shadow-[0_24px_60px_-28px_color-mix(in_oklab,var(--color-primary)_85%,transparent)] lg:-translate-y-3"
                    : "border-border"
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

      {/* Recursos em formato compacto: informa sem competir com os planos. */}
      <section className="border-t border-border px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-lg font-medium">Tudo isso está incluído</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="lift flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-14 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/20 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--color-primary)_14%,var(--color-card)),var(--color-card))] p-8 text-center shadow-[var(--shadow-elegant)] sm:p-12">
          <div
            aria-hidden
            className="blob pointer-events-none -top-24 left-1/2 size-[22rem] -translate-x-1/2 bg-[color-mix(in_oklab,var(--color-primary)_25%,transparent)] opacity-50"
          />
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

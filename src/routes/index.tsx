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
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Captions,
    title: "Transcrição ao vivo com IA",
    desc: "A fala vira texto em tempo real, com pontuação e acentuação natural — nada de legenda robótica.",
  },
  {
    icon: Languages,
    title: "Tradução em tempo real",
    desc: "Traduza as legendas na hora para inglês, espanhol, francês, alemão, italiano e mais.",
  },
  {
    icon: FileText,
    title: "Ata gerada por IA",
    desc: "Ao final, gere uma ata profissional a partir da transcrição — modelos formal, executivo ou detalhado.",
  },
  {
    icon: KanbanSquare,
    title: "Gestão estilo Kanban",
    desc: "Organize tarefas e acompanhamentos das reuniões em quadros Kanban, movendo cartões entre colunas.",
  },
  {
    icon: ShieldCheck,
    title: "Vídeo HD seguro",
    desc: "Câmera, áudio, chat e compartilhamento de tela com acesso protegido por tokens assinados.",
  },
];

const PLANS = PLAN_LIST;
const STATS = [
  { value: "20%", label: "mais barato" },
  { value: "HD", label: "vídeo seguro" },
  { value: "IA", label: "ata automática" },
];

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[20%] -top-[20%] h-[70%] w-[70%] rounded-full bg-aurora-teal/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] h-[70%] w-[70%] rounded-full bg-aurora-violet/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[50%] w-[50%] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 mx-auto mt-3 max-w-6xl px-3 sm:px-6">
        <div className="glass flex items-center justify-between gap-2 rounded-full px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src={logoUrl.url} alt="FreeduMeet" className="size-8 shrink-0 rounded-lg object-cover sm:size-9" />
            <span className="truncate font-display text-xl font-normal tracking-tight text-foreground sm:text-[1.375rem]">
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
              className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Entrar
            </Link>
            <Link
              to="/manual"
              className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Manual
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:shadow-[var(--shadow-elegant)]"
            >
              Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-24 grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 sm:px-6 md:mt-28 md:grid-cols-2 md:py-16">
        <div className="w-full max-w-lg min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-4 text-primary" />
            Reuniões com IA integrada
          </div>

          <h1 className="mt-6 font-display text-[2.25rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[2.75rem] md:text-[3.5rem]">
            Videochamadas e reuniões para{" "}
            <span className="text-gradient">todos</span>
          </h1>
          <p className="mt-5 text-base font-normal text-muted-foreground sm:text-lg">
            Conecte-se, colabore e comemore de qualquer lugar com o FreeduMeet.
            Segurança nacional, preço justo e inteligência artificial que economiza seu tempo.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              onClick={createMeeting}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:shadow-[var(--shadow-elegant)] hover:brightness-105"
            >
              <Video className="size-5" />
              Nova reunião
            </button>

            <div className="glass flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-2 transition-colors focus-within:bg-secondary/50">
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
                className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-transparent"
              >
                Participar
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Sem instalação
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Criptografia de ponta
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <CheckCircle2 className="size-4 text-primary" />
              Atas automáticas
            </span>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <dt className="font-display text-2xl font-normal text-primary">{s.value}</dt>
                <dd className="text-xs text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex w-full min-w-0 flex-col items-center justify-center overflow-hidden text-center">
          <div className="relative flex size-64 shrink-0 items-center justify-center [--orbit-r:112px] sm:size-80 sm:[--orbit-r:172px]">
            {/* soft aurora disc */}
            <div className="absolute size-56 rounded-full bg-gradient-to-br from-aurora-teal/30 to-aurora-violet/30 blur-2xl sm:size-72" />
            <div className="absolute size-44 rounded-full border border-border/60 sm:size-60" />
            <div className="absolute size-56 rounded-full border border-dashed border-border/40 sm:size-72" />

            {/* logo core */}
            <div className="relative flex size-40 items-center justify-center rounded-full bg-card/80 shadow-[var(--shadow-elegant)] backdrop-blur-xl sm:size-52">
              <img
                src={logoTransparentUrl.url}
                alt="FreeduMeet"
                className="size-28 object-contain sm:size-36"
              />
            </div>

            {/* orbiting feature labels */}
            {FEATURES.map((f, i) => {
              const delay = -(i / FEATURES.length) * 44;
              return (
                <div
                  key={f.title}
                  style={{
                    animation: "orbit 44s linear infinite",
                    animationDelay: `${delay}s`,
                  }}
                  className="absolute left-1/2 top-1/2"
                >
                  <span className="glass flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-medium text-foreground sm:text-xs">
                    <f.icon className="size-3.5 shrink-0 text-primary" />
                    {f.title}
                  </span>
                </div>
              );
            })}
          </div>
          <h2 className="mt-10 font-display text-lg font-normal sm:text-xl">Receba um link para compartilhar</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Clique em <span className="font-medium text-foreground">Nova reunião</span> para receber um link
            que você pode enviar às pessoas com quem quer se reunir.
          </p>
        </div>
      </main>

      <section className="border-t border-border/60 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-sm font-medium text-primary">Recursos</span>
              <h2 className="mt-2 font-display text-2xl font-normal md:text-3xl">
                Por que escolher o FreeduMeet
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Muito além de uma chamada de vídeo: recursos de IA que economizam
                seu tempo em cada reunião.
              </p>
            </div>
            <Link
              to="/manual"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver manual <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 transition-all hover:shadow-[var(--shadow-elegant)]"
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

      <section id="planos" className="border-t border-border/60 px-4 py-16 sm:px-6 sm:py-20">
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
                className={`relative flex flex-col rounded-2xl border bg-card/60 p-7 backdrop-blur-xl transition-all hover:shadow-[var(--shadow-elegant)] ${
                  plan.highlight ? "border-primary shadow-[var(--shadow-glow)]" : "border-border/60"
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
                  className={`mt-7 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)]"
                      : "border border-border/60 text-primary hover:bg-secondary"
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

      <footer className="border-t border-border/60 px-4 py-10 sm:px-6">
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

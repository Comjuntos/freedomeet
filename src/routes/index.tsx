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

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-10 sm:px-6 md:grid-cols-2">
        <div className="w-full max-w-md min-w-0">
          <h1 className="font-display text-[2.25rem] font-normal leading-[1.15] tracking-[-0.01em] sm:text-[2.75rem] md:text-[3.25rem]">
            Videochamadas e reuniões para todos
          </h1>
          <p className="mt-4 text-base font-normal text-muted-foreground sm:text-lg">
            Conecte-se, colabore e comemore de qualquer lugar com o FreeduMeet.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              onClick={createMeeting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--shadow-elegant)]"
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
          <p className="mt-4 text-sm text-muted-foreground">
            <a className="text-primary hover:underline" href="#planos">Saiba mais</a> sobre o FreeduMeet
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              { k: "20%", v: "mais barato" },
              { k: "HD", v: "vídeo seguro" },
              { k: "IA", v: "ata automática" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-2xl font-normal text-primary">{s.k}</dt>
                <dd className="text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex w-full min-w-0 flex-col items-center justify-center overflow-hidden text-center">
          <div className="relative flex size-64 shrink-0 items-center justify-center [--orbit-r:112px] sm:size-80 sm:[--orbit-r:172px]">
            {/* soft Meet-style disc */}
            <div className="absolute size-56 rounded-full bg-primary/8 sm:size-72" />
            <div className="absolute size-44 rounded-full border border-border sm:size-60" />

            {/* logo core */}
            <div className="relative flex size-40 items-center justify-center rounded-full bg-card shadow-[var(--shadow-elegant)] sm:size-52">
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
                  <span
                    className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap text-[9px] font-medium text-muted-foreground sm:gap-1.5 sm:text-xs"
                  >
                    <f.icon className="size-3 shrink-0 text-primary sm:size-3.5" />
                    {f.title}
                  </span>
                </div>
              );
            })}
          </div>
          <h2 className="mt-10 font-display text-lg font-normal sm:text-xl">Receba um link para compartilhar</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Clique em <span className="font-medium">Nova reunião</span> para receber um link
            que você pode enviar às pessoas com quem quer se reunir.
          </p>
        </div>
      </main>

      <section className="border-t border-border bg-secondary/50 px-4 py-12 sm:px-6 sm:py-16">
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

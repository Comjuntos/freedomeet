import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  // Se o usuário já estiver logado, carrega o painel automaticamente.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
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

  return (
    <div className="aurora-bg flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src={logoUrl.url} alt="FreeduMeet" className="size-9 rounded-xl object-cover" />
          <span className="font-display text-xl font-semibold tracking-tight">FreeduMeet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-2 hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button className="rounded-full p-2.5 text-muted-foreground hover:bg-secondary" aria-label="Ajuda">
            <HelpCircle className="size-5" />
          </button>
          <button className="rounded-full p-2.5 text-muted-foreground hover:bg-secondary" aria-label="Configurações">
            <Settings className="size-5" />
          </button>
          <Link
            to="/auth"
            className="ml-1 inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Entrar
          </Link>
          <Link
            to="/app"
            className="ml-1 inline-flex items-center rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Painel
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-8 md:grid-cols-2">
        <div className="max-w-md">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Soberania Nacional
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Reuniões que{" "}
            <span className="text-gradient">pensam</span> com você
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Conecte-se, colabore e comemore de qualquer lugar. Escolha o plano ideal —
            do Gratuito ao Empresarial — e pague menos do que nas grandes plataformas.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <button
              onClick={createMeeting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground glow transition-transform hover:scale-105"
            >
              <Video className="size-5" />
              Nova reunião
            </button>

            <div className="flex items-center gap-2">
              <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5">
                <Keyboard className="size-5 text-muted-foreground" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                  placeholder="Digite um código ou link"
                  className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={joinMeeting}
                disabled={!code.trim()}
                className="px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary/70 rounded-md disabled:text-muted-foreground disabled:opacity-60"
              >
                Participar
              </button>
            </div>
          </div>

          <hr className="mt-8 border-border" />
          <p className="mt-4 text-sm text-muted-foreground">
            <a className="text-primary hover:underline" href="#planos">Saiba mais</a> sobre o Meet
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              { k: "20%", v: "mais barato" },
              { k: "HD", v: "vídeo seguro" },
              { k: "IA", v: "ata automática" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-gradient font-display text-2xl font-bold">{s.k}</dt>
                <dd className="text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex size-80 items-center justify-center [perspective:1200px]">
            {/* living aura */}
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl" />
            <div className="absolute size-80 breathe rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-2xl" />

            {/* rotating orbital rings */}
            <div className="spin-slow absolute size-72 rounded-full border border-dashed border-primary/25" />
            <div className="spin-slow-rev absolute size-60 rounded-full border border-primary/15" />
            <div className="spin-slow absolute size-72">
              <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-primary glow" />
            </div>
            <div className="spin-slow-rev absolute size-60">
              <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full bg-accent" />
            </div>

            {/* floating logo core */}
            <div className="glass breathe tilt-3d relative flex size-52 items-center justify-center rounded-full glow">
              <img
                src={logoTransparentUrl.url}
                alt="FreeduMeet"
                className="float size-36 object-contain drop-shadow-[0_10px_30px_oklch(0.58_0.17_258_/_35%)]"
              />
            </div>

            {/* live floating feature objects */}
            {FEATURES.map((f, i) => {
              const delay = -(i / FEATURES.length) * 44;
              return (
                <div
                  key={f.title}
                  style={{
                    ["--orbit-r" as string]: "180px",
                    animation: "orbit 44s linear infinite",
                    animationDelay: `${delay}s`,
                  }}
                  className="absolute left-1/2 top-1/2"
                >
                  <span
                    className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-foreground/90 transition-transform hover:scale-110"
                  >
                    <f.icon className="size-3.5 shrink-0 text-primary" />
                    {f.title}
                  </span>
                </div>
              );
            })}
          </div>
          <h2 className="mt-10 text-xl font-semibold">Receba um link para compartilhar</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Clique em <span className="font-medium">Nova reunião</span> para receber um link
            que você pode enviar às pessoas com quem quer se reunir.
          </p>
        </div>
      </main>

      <section className="border-t border-border bg-secondary/20 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Recursos</span>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
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
                className="glass rounded-2xl p-6 transition-transform hover:-translate-y-1"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
          <h2 className="mt-2 text-2xl font-medium md:text-3xl">Planos e assinaturas</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Preços pensados para o mercado brasileiro, sempre cerca de 20% mais baratos
            que as principais plataformas de videoconferência.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 transition-transform hover:-translate-y-1 ${
                  plan.highlight
                    ? "glass glow border-primary/40"
                    : "glass"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
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
                  onClick={createMeeting}
                  className={`mt-7 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:scale-105"
                      : "rounded-full border border-border hover:bg-secondary"
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

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoUrl.url} alt="FreeduMeet" className="size-7 rounded-lg object-cover" />
            <span className="font-display font-semibold text-foreground">FreeduMeet</span>
          </div>
          <p>© {new Date().getFullYear()} FreeduMeet — Videoconferência com soberania nacional.</p>
        </div>
      </footer>
    </div>
  );
}

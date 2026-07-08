import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Video,
  Keyboard,
  HelpCircle,
  Settings,
  Captions,
  Languages,
  FileText,
  ShieldCheck,
  Link2,
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
    icon: Link2,
    title: "Sem cadastro nem instalação",
    desc: "Crie ou entre em salas direto do navegador e compartilhe o link com quem quiser.",
  },
  {
    icon: ShieldCheck,
    title: "Vídeo HD seguro",
    desc: "Câmera, áudio, chat e compartilhamento de tela com acesso protegido por tokens assinados.",
  },
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Video className="size-7 text-primary" />
          <span className="text-xl font-medium">FreeduMeet</span>
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
            to="/app"
            className="ml-1 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Painel
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-8 md:grid-cols-2">
        <div className="max-w-md">
          <h1 className="text-4xl font-normal leading-tight tracking-tight md:text-5xl">
            Chamadas de vídeo e reuniões para todos
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Conecte-se, colabore e comemore de qualquer lugar com o Meet.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <button
              onClick={createMeeting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Video className="size-5" />
              Nova reunião
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5">
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
            <a className="text-primary hover:underline" href="#">Saiba mais</a> sobre o Meet
          </p>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex size-72 items-center justify-center rounded-full bg-secondary">
            <Video className="size-24 text-primary" />
          </div>
          <h2 className="mt-8 text-xl font-medium">Receba um link para compartilhar</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Clique em <span className="font-medium">Nova reunião</span> para receber um link
            que você pode enviar às pessoas com quem quer se reunir.
          </p>
        </div>
      </main>

      <section className="border-t border-border bg-secondary/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-medium md:text-3xl">
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
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

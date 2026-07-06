import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Video, Plus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Encontro — Videoconferência aberta" },
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
    navigate({ to: "/room/$roomId", params: { roomId: randomRoom() } });
  };

  const joinMeeting = () => {
    const room = code.trim().replace(/\s+/g, "-");
    if (room) navigate({ to: "/room/$roomId", params: { roomId: room } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-6">
        <Video className="size-6 text-primary" />
        <span className="text-lg font-semibold">Encontro</span>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Reuniões de vídeo para todos
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Crie uma sala em um clique ou entre com um código. Câmera, áudio,
            chat e compartilhamento de tela — sem instalar nada.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={createMeeting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Nova reunião
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                placeholder="Digite um código"
                className="w-40 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={joinMeeting}
                disabled={!code.trim()}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-secondary disabled:opacity-40"
              >
                Entrar
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-secondary">
            <Video className="size-16 text-muted-foreground" />
          </div>
        </div>
      </main>
    </div>
  );
}

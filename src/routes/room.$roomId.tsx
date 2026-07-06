import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const JITSI_DOMAIN = "meet.jit.si";
const SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [{ title: "Sala — Encontro" }],
  }),
  component: Room,
});

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      dispose: () => void;
      addEventListener: (event: string, cb: () => void) => void;
    };
  }
}

function loadJitsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load error")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o Jitsi"));
    document.body.appendChild(script);
  });
}

function Room() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let api: { dispose: () => void; addEventListener: (e: string, cb: () => void) => void } | null =
      null;
    let cancelled = false;

    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
        api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: roomId,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: { prejoinPageEnabled: true, defaultLanguage: "ptBR" },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false, LANG_DETECTION: false },
        });
        api.addEventListener("readyToClose", () => {
          navigate({ to: "/" });
        });
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar a sala de vídeo.");
      });

    return () => {
      cancelled = true;
      api?.dispose();
    };
  }, [roomId, navigate]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao início
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1" />
      )}
    </div>
  );
}
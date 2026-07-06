import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, X, Languages } from "lucide-react";
import { translateText } from "@/lib/translate.functions";

const JITSI_DOMAIN = "meet.jit.si";
const SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [{ title: "Sala — FreedoMeet" }],
  }),
  component: Room,
});

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      dispose: () => void;
      addEventListener: (event: string, cb: () => void) => void;
    };
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { 0: { transcript: string }; isFinal: boolean };
  };
}

const SOURCE_LANGS = [
  { code: "pt-BR", label: "Português" },
  { code: "en-US", label: "Inglês" },
  { code: "es-ES", label: "Espanhol" },
  { code: "fr-FR", label: "Francês" },
  { code: "de-DE", label: "Alemão" },
  { code: "it-IT", label: "Italiano" },
];
const TARGET_LANGS = [
  { code: "", label: "Sem tradução" },
  { code: "Português", label: "Português" },
  { code: "Inglês", label: "Inglês" },
  { code: "Espanhol", label: "Espanhol" },
  { code: "Francês", label: "Francês" },
  { code: "Alemão", label: "Alemão" },
  { code: "Italiano", label: "Italiano" },
];

interface Caption {
  id: number;
  original: string;
  translated?: string;
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
  const [ended, setEnded] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [listening, setListening] = useState(false);
  const [sourceLang, setSourceLang] = useState("pt-BR");
  const [targetLang, setTargetLang] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const targetRef = useRef(targetLang);
  const idRef = useRef(0);
  const translate = useServerFn(translateText);

  useEffect(() => {
    targetRef.current = targetLang;
  }, [targetLang]);

  const startListening = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setUnsupported(true);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = sourceLang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) continue;
        const text = r[0].transcript.trim();
        if (!text) continue;
        const id = ++idRef.current;
        setCaptions((prev) => [...prev.slice(-30), { id, original: text }]);
        const target = targetRef.current;
        if (target) {
          translate({ data: { text, target } })
            .then((res) => {
              setCaptions((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, translated: res.translation } : c,
                ),
              );
            })
            .catch(() => {});
        }
      }
    };
    recognition.onend = () => {
      if (listeningRef.current) recognition.start();
    };
    recognition.onerror = () => {};
    recognitionRef.current = recognition;
    listeningRef.current = true;
    setListening(true);
    recognition.start();
  }, [sourceLang, translate]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // Restart recognition when the source language changes mid-session.
  useEffect(() => {
    if (listening) {
      stopListening();
      const t = setTimeout(startListening, 200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceLang]);

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
          configOverwrite: {
            prejoinPageEnabled: true,
            defaultLanguage: "ptBR",
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            LANG_DETECTION: false,
            APP_NAME: "FreedoMeet",
            NATIVE_APP_NAME: "FreedoMeet",
            PROVIDER_NAME: "FreedoMeet",
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            HIDE_DEEP_LINKING_LOGO: true,
            JITSI_WATERMARK_LINK: "",
            DEFAULT_LOGO_URL: "",
            DEFAULT_WELCOME_PAGE_LOGO_URL: "",
          },
        });
        api.addEventListener("readyToClose", () => {
          setEnded(true);
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
      {ended ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex items-center gap-2">
            <Captions className="size-7 text-primary" />
            <span className="text-2xl font-medium">FreedoMeet</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Você saiu da reunião</h1>
            <p className="mt-2 text-muted-foreground">
              Obrigado por usar o FreedoMeet.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary"
            >
              Voltar a entrar
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      ) : error ? (
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
        <div className="relative flex flex-1 overflow-hidden">
          <div ref={containerRef} className="flex-1" />
          {showCaptions && (
            <aside className="flex w-80 flex-col border-l border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <Captions className="size-4 text-primary" />
                  Transcrição
                </div>
                <button
                  onClick={() => setShowCaptions(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                  aria-label="Fechar transcrição"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-border p-3 text-xs">
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Idioma falado</span>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-1.5"
                  >
                    {SOURCE_LANGS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Traduzir para</span>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-1.5"
                  >
                    {TARGET_LANGS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                {unsupported ? (
                  <p className="text-muted-foreground">
                    Seu navegador não suporta transcrição por voz. Use o Chrome
                    para esse recurso.
                  </p>
                ) : captions.length === 0 ? (
                  <p className="text-muted-foreground">
                    Ative a transcrição e comece a falar para ver as legendas
                    aqui.
                  </p>
                ) : (
                  captions.map((c) => (
                    <div key={c.id}>
                      <p>{c.original}</p>
                      {c.translated && (
                        <p className="mt-0.5 flex items-start gap-1 text-primary">
                          <Languages className="mt-0.5 size-3 shrink-0" />
                          {c.translated}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border p-3">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    listening
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {listening ? "Parar transcrição" : "Iniciar transcrição"}
                </button>
              </div>
            </aside>
          )}

          {!showCaptions && (
            <button
              onClick={() => setShowCaptions(true)}
              className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              <Captions className="size-4" />
              Transcrição
            </button>
          )}
        </div>
      )}
    </div>
  );
}
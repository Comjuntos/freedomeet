import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Captions,
  X,
  Languages,
  FileText,
  ClipboardList,
  Gauge,
  ChartColumnBig,
  Sparkles,
  ChevronDown,
  Download,
  Copy,
  Loader2,
  Clock,
  Hash,
  Send,
} from "lucide-react";
import { translateText } from "@/lib/translate.functions";
import { punctuateText } from "@/lib/punctuate.functions";
import { generateMinutes } from "@/lib/minutes.functions";
import { analyzeSentiment, type SentimentResult } from "@/lib/sentiment.functions";
import { analyzeDashboard, type DashboardResult } from "@/lib/dashboard.functions";
import { listSlackChannels, sendToSlack, type SlackChannel } from "@/lib/slack.functions";
import { getJaasToken } from "@/lib/jaas.functions";

const JITSI_DOMAIN = "8x8.vc";
const SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [{ title: "Sala — FreeduMeet" }],
  }),
  component: Room,
});

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      dispose: () => void;
      addEventListener: (event: string, cb: () => void) => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
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

const MINUTES_TEMPLATES = [
  { code: "formal", label: "Formal / Corporativa" },
  { code: "executiva", label: "Executiva (resumida)" },
  { code: "detalhada", label: "Detalhada" },
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
  const [isHost, setIsHost] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [name, setName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const startTimeRef = useRef<number | null>(null);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showAiTools, setShowAiTools] = useState(false);
  const [listening, setListening] = useState(false);
  const [sourceLang, setSourceLang] = useState("pt-BR");
  const [targetLang, setTargetLang] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const targetRef = useRef(targetLang);
  const idRef = useRef(0);

  // Apenas quem criou a sala é o administrador (host) da reunião.
  useEffect(() => {
    setIsHost(sessionStorage.getItem(`freedomeet-host-${roomId}`) === "1");
  }, [roomId]);

  // Nome do participante (usado para gerar o avatar de cada um).
  useEffect(() => {
    const saved = sessionStorage.getItem("freedomeet-name");
    if (saved) setName(saved);
  }, []);

  const avatarUrl = name
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`
    : "";
  const translate = useServerFn(translateText);
  const punctuate = useServerFn(punctuateText);
  const fetchToken = useServerFn(getJaasToken);
  const makeMinutes = useServerFn(generateMinutes);
  const runSentiment = useServerFn(analyzeSentiment);
  const runDashboard = useServerFn(analyzeDashboard);
  const loadChannels = useServerFn(listSlackChannels);
  const postToSlack = useServerFn(sendToSlack);
  const [showMinutes, setShowMinutes] = useState(false);
  const [minutesTemplate, setMinutesTemplate] = useState("formal");
  const [minutesText, setMinutesText] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [minutesLoading, setMinutesLoading] = useState(false);
  const [minutesError, setMinutesError] = useState<string | null>(null);
  const [showSentiment, setShowSentiment] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResult | null>(null);
  const [dashboardStats, setDashboardStats] = useState({ words: 0, segments: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [slackChannel, setSlackChannel] = useState("");
  const [slackSending, setSlackSending] = useState(false);
  const [slackStatus, setSlackStatus] = useState<string | null>(null);
  // Fluxo automático de ata ao encerrar a reunião (somente administrador).
  const [endMinutes, setEndMinutes] = useState("");
  const [endLoading, setEndLoading] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [endSlackStatus, setEndSlackStatus] = useState<string | null>(null);
  const autoRanRef = useRef(false);

  const openDashboard = useCallback(async () => {
    const segments = captions.map((c) => c.original).filter(Boolean);
    const transcript = segments.join("\n").trim();
    setShowDashboard(true);
    if (!transcript) {
      setDashboard(null);
      setDashboardError(
        "Não há transcrição ainda. Ative a transcrição e fale durante a reunião.",
      );
      return;
    }
    const words = transcript.split(/\s+/).filter(Boolean).length;
    setDashboardStats({ words, segments: segments.length });
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const res = await runDashboard({ data: { transcript } });
      setDashboard(res);
    } catch {
      setDashboardError("Não foi possível gerar o dashboard. Tente novamente.");
    } finally {
      setDashboardLoading(false);
    }
  }, [captions, runDashboard]);

  const analyze = useCallback(async () => {
    const transcript = captions
      .map((c) => c.original)
      .join("\n")
      .trim();
    setShowSentiment(true);
    if (!transcript) {
      setSentiment(null);
      setSentimentError(
        "Não há transcrição ainda. Ative a transcrição e fale durante a reunião.",
      );
      return;
    }
    setSentimentLoading(true);
    setSentimentError(null);
    try {
      const res = await runSentiment({ data: { transcript } });
      setSentiment(res);
    } catch {
      setSentimentError("Não foi possível analisar o sentimento. Tente novamente.");
    } finally {
      setSentimentLoading(false);
    }
  }, [captions, runSentiment]);

  const generateAta = useCallback(async () => {
    const transcript = captions
      .map((c) => c.original)
      .join("\n")
      .trim();
    const members = membersInput
      .split("\n")
      .map((m) => m.trim())
      .filter(Boolean);
    if (members.length === 0) {
      setMinutesError(
        "Informe os membros da reunião (nome completo de cada um, um por linha).",
      );
      setShowMinutes(true);
      return;
    }
    if (!transcript) {
      setMinutesError(
        "Não há transcrição ainda. Ative a transcrição e fale durante a reunião.",
      );
      setShowMinutes(true);
      return;
    }
    setShowMinutes(true);
    setMinutesLoading(true);
    setMinutesError(null);
    setMinutesText("");
    try {
      const startedAt =
        startTimeRef.current !== null
          ? new Date(startTimeRef.current).toLocaleString("pt-BR")
          : undefined;
      const res = await makeMinutes({
        data: { transcript, template: minutesTemplate, title: roomId, members, startedAt },
      });
      setMinutesText(res.minutes);
    } catch {
      setMinutesError("Não foi possível gerar a ata. Tente novamente.");
    } finally {
      setMinutesLoading(false);
    }
  }, [captions, makeMinutes, minutesTemplate, roomId, membersInput]);

  const downloadAta = useCallback(async (text?: unknown) => {
    const content = (typeof text === "string" ? text : minutesText).trim();
    if (!content) return;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

    const paragraphs = content.split("\n").map((raw) => {
      const line = raw.trimEnd();
      if (line.startsWith("# "))
        return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(line.slice(2))] });
      if (line.startsWith("## "))
        return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(line.slice(3))] });
      if (line.startsWith("### "))
        return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(line.slice(4))] });
      if (/^\s*[-*]\s+/.test(line))
        return new Paragraph({ bullet: { level: 0 }, children: [new TextRun(line.replace(/^\s*[-*]\s+/, ""))] });
      // Renderiza **negrito** de forma simples.
      const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
      const runs = parts.map((p) =>
        p.startsWith("**") && p.endsWith("**")
          ? new TextRun({ text: p.slice(2, -2), bold: true })
          : new TextRun(p),
      );
      return new Paragraph({ children: runs.length ? runs : [new TextRun("")] });
    });

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ata-${roomId}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [minutesText, roomId]);

  const downloadTranscript = useCallback(() => {
    const lines = captions
      .map((c) => (c.translated ? `${c.original}\n  → ${c.translated}` : c.original))
      .filter(Boolean);
    if (lines.length === 0) return;
    const header = `Transcrição da reunião: ${roomId}\nData: ${new Date().toLocaleString("pt-BR")}\n\n`;
    const blob = new Blob([header + lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcricao-${roomId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [captions, roomId]);

  // Carrega os canais do Slack quando a ata é gerada.
  useEffect(() => {
    if (!minutesText || slackChannels.length > 0) return;
    loadChannels()
      .then((chs) => {
        setSlackChannels(chs);
        if (chs[0]) setSlackChannel(chs[0].id);
      })
      .catch(() => setSlackStatus("Não foi possível carregar os canais do Slack."));
  }, [minutesText, slackChannels.length, loadChannels]);

  const sendAtaToSlack = useCallback(async () => {
    if (!slackChannel || !minutesText) return;
    setSlackSending(true);
    setSlackStatus(null);
    try {
      await postToSlack({
        data: { channel: slackChannel, text: `*Ata da reunião ${roomId}*\n\n${minutesText}` },
      });
      setSlackStatus("Ata enviada para o Slack! ✅");
    } catch {
      setSlackStatus("Falha ao enviar para o Slack.");
    } finally {
      setSlackSending(false);
    }
  }, [slackChannel, minutesText, postToSlack, roomId]);

  useEffect(() => {
    targetRef.current = targetLang;
  }, [targetLang]);

  // Ao encerrar a reunião, o administrador recebe automaticamente a ata
  // gerada a partir da transcrição e enviada para o Slack — sem cliques.
  useEffect(() => {
    if (!ended || !isHost || autoRanRef.current) return;
    autoRanRef.current = true;
    const transcript = captions
      .map((c) => c.original)
      .join("\n")
      .trim();
    if (!transcript) {
      setEndError(
        "Nenhuma transcrição foi capturada nesta reunião, então não há ata para gerar.",
      );
      return;
    }
    setEndLoading(true);
    (async () => {
      try {
        const startedAt =
          startTimeRef.current !== null
            ? new Date(startTimeRef.current).toLocaleString("pt-BR")
            : undefined;
        const res = await makeMinutes({
          data: { transcript, template: "executiva", title: roomId, startedAt },
        });
        setEndMinutes(res.minutes);
        try {
          const chs = await loadChannels();
          const ch = chs[0];
          if (ch) {
            await postToSlack({
              data: {
                channel: ch.id,
                text: `*Ata automática — reunião ${roomId}*\n\n${res.minutes}`,
              },
            });
            setEndSlackStatus(`Ata enviada automaticamente para #${ch.name} no Slack ✅`);
          }
        } catch {
          setEndSlackStatus(
            "Ata gerada, mas não foi possível enviá-la ao Slack automaticamente.",
          );
        }
      } catch {
        setEndError("Não foi possível gerar a ata automática. Tente gerar manualmente.");
      } finally {
        setEndLoading(false);
      }
    })();
  }, [ended, isHost, captions, makeMinutes, roomId, loadChannels, postToSlack]);

  // Meeting duration timer: starts once the room mounts, stops when it ends.
  useEffect(() => {
    if (startTimeRef.current === null) startTimeRef.current = Date.now();
    if (ended) return;
    const tick = () => {
      if (startTimeRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [ended]);

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
        const raw = r[0].transcript.trim();
        if (!raw) continue;
        const id = ++idRef.current;
        setCaptions((prev) => [...prev, { id, original: raw }]);
        // Polish the raw speech-to-text into natural, punctuated text,
        // then translate the polished version.
        punctuate({ data: { text: raw, lang: sourceLang } })
          .then((res) => {
            const clean = res.text || raw;
            setCaptions((prev) =>
              prev.map((c) => (c.id === id ? { ...c, original: clean } : c)),
            );
            const target = targetRef.current;
            if (target) {
              translate({ data: { text: clean, target } })
                .then((tr) => {
                  setCaptions((prev) =>
                    prev.map((c) =>
                      c.id === id ? { ...c, translated: tr.translation } : c,
                    ),
                  );
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
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
  }, [sourceLang, translate, punctuate]);

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
    let api: {
      dispose: () => void;
      addEventListener: (e: string, cb: () => void) => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
    } | null = null;
    let cancelled = false;
    if (!name) return;

    Promise.all([
      loadJitsiScript(),
      fetchToken({ data: { room: roomId, name, avatar: avatarUrl, moderator: isHost } }),
    ])
      .then(([, tokenRes]) => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
        api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: `${tokenRes.appId}/${roomId}`,
          jwt: tokenRes.token,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: name },
          configOverwrite: {
            prejoinPageEnabled: false,
            defaultLanguage: "ptBR",
            disableDeepLinking: true,
            readOnlyName: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            LANG_DETECTION: false,
            APP_NAME: "FreeduMeet",
            NATIVE_APP_NAME: "FreeduMeet",
            PROVIDER_NAME: "FreeduMeet",
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
        api.executeCommand("displayName", name);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar a sala de vídeo.");
      });

    return () => {
      cancelled = true;
      api?.dispose();
    };
  }, [roomId, navigate, fetchToken, name, avatarUrl, isHost]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {ended ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex items-center gap-2">
            <Captions className="size-7 text-primary" />
            <span className="text-2xl font-medium">FreeduMeet</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Você saiu da reunião</h1>
            <p className="mt-2 text-muted-foreground">
              Obrigado por usar o FreeduMeet.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
              <Clock className="size-4 text-primary" />
              Duração total: {formatDuration(elapsed)}
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
      ) : !name ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex items-center gap-2">
            <Captions className="size-7 text-primary" />
            <span className="text-2xl font-medium">FreeduMeet</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = nameInput.trim();
              if (!v) return;
              sessionStorage.setItem("freedomeet-name", v);
              setName(v);
            }}
            className="flex w-full max-w-sm flex-col items-center gap-4"
          >
            <div>
              <h1 className="text-xl font-semibold">Como você quer aparecer?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Seu nome gera um avatar visível para todos os participantes.
              </p>
            </div>
            {nameInput.trim() && (
              <img
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nameInput.trim())}`}
                alt="Prévia do avatar"
                className="size-20 rounded-full border border-border bg-secondary"
              />
            )}
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-center"
            />
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Entrar na reunião
            </button>
          </form>
        </div>
      ) : (
        <div className="relative flex flex-1 overflow-hidden">
          <div ref={containerRef} className="flex-1" />
          <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
            <Clock className="size-4" />
            {formatDuration(elapsed)}
          </div>
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

              <div className="space-y-2 border-t border-border p-3">
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
                {isHost ? (
                  <>
                    <button
                      onClick={downloadTranscript}
                      disabled={captions.length === 0}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-60"
                    >
                      <Download className="size-4" />
                      Baixar transcrição
                    </button>
                    <button
                      onClick={() => setShowAiTools((v) => !v)}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      <Sparkles className="size-4" />
                      Ferramentas IA
                      <ChevronDown
                        className={`size-4 transition-transform ${showAiTools ? "rotate-180" : ""}`}
                      />
                    </button>
                  </>
                ) : (
                  <p className="rounded-md bg-secondary/50 px-3 py-2 text-center text-xs text-muted-foreground">
                    Apenas o administrador da sala pode baixar a transcrição e usar as ferramentas de IA.
                  </p>
                )}
                {isHost && showAiTools && (
                  <div className="space-y-2">
                    <button
                      onClick={generateAta}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      <ClipboardList className="size-4" />
                      Gerar ata
                    </button>
                    <button
                      onClick={analyze}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      <Gauge className="size-4" />
                      Análise de sentimento
                    </button>
                    <button
                      onClick={openDashboard}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      <ChartColumnBig className="size-4" />
                      Dashboard de falas
                    </button>
                  </div>
                )}
              </div>
            </aside>
          )}

          {showMinutes && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
              <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="size-4 text-primary" />
                    Ata da reunião
                  </div>
                  <button
                    onClick={() => setShowMinutes(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                    aria-label="Fechar"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-3 border-b border-border px-5 py-3 text-sm">
                  <label className="flex w-full flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      Membros da reunião (nome completo, um por linha)
                    </span>
                    <textarea
                      value={membersInput}
                      onChange={(e) => setMembersInput(e.target.value)}
                      rows={3}
                      placeholder={"Maria da Silva Santos\nJoão Pereira de Souza"}
                      className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Modelo</span>
                    <select
                      value={minutesTemplate}
                      onChange={(e) => setMinutesTemplate(e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1.5"
                    >
                      {MINUTES_TEMPLATES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={generateAta}
                    disabled={minutesLoading}
                    className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {minutesLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ClipboardList className="size-4" />
                    )}
                    {minutesText ? "Gerar novamente" : "Gerar ata"}
                  </button>
                  {minutesText && !minutesLoading && (
                    <>
                      <button
                        onClick={() => navigator.clipboard?.writeText(minutesText)}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 font-medium hover:bg-secondary"
                      >
                        <Copy className="size-4" />
                        Copiar
                      </button>
                      <button
                        onClick={downloadAta}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 font-medium hover:bg-secondary"
                      >
                        <Download className="size-4" />
                        Baixar
                      </button>
                      <select
                        value={slackChannel}
                        onChange={(e) => setSlackChannel(e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-2 text-sm"
                      >
                        {slackChannels.length === 0 ? (
                          <option value="">Carregando canais…</option>
                        ) : (
                          slackChannels.map((c) => (
                            <option key={c.id} value={c.id}>
                              #{c.name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        onClick={sendAtaToSlack}
                        disabled={slackSending || !slackChannel}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 font-medium hover:bg-secondary disabled:opacity-60"
                      >
                        {slackSending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        Enviar ao Slack
                      </button>
                    </>
                  )}
                </div>
                {slackStatus && (
                  <p className="px-5 pt-1 text-xs text-muted-foreground">{slackStatus}</p>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
                  {minutesError ? (
                    <p className="text-destructive">{minutesError}</p>
                  ) : minutesLoading ? (
                    <p className="text-muted-foreground">Gerando a ata com base na transcrição…</p>
                  ) : minutesText ? (
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                      {minutesText}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">
                      Escolha um modelo e clique em “Gerar ata” para criar o
                      documento a partir da transcrição.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSentiment && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
              <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Gauge className="size-4 text-primary" />
                    Análise de sentimento
                  </div>
                  <button
                    onClick={() => setShowSentiment(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                    aria-label="Fechar"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
                  {sentimentError ? (
                    <p className="text-destructive">{sentimentError}</p>
                  ) : sentimentLoading ? (
                    <p className="text-muted-foreground">
                      Analisando o clima da reunião…
                    </p>
                  ) : sentiment ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            sentiment.label === "positivo"
                              ? "bg-green-500/15 text-green-600"
                              : sentiment.label === "negativo"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {sentiment.label}
                        </span>
                        <span className="text-2xl font-semibold">
                          {sentiment.score}
                          <span className="text-sm text-muted-foreground">/100</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${
                            sentiment.label === "positivo"
                              ? "bg-green-500"
                              : sentiment.label === "negativo"
                                ? "bg-destructive"
                                : "bg-muted-foreground"
                          }`}
                          style={{ width: `${sentiment.score}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground">{sentiment.summary}</p>
                      {sentiment.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sentiment.emotions.map((e) => (
                            <span
                              key={e}
                              className="rounded-md bg-secondary px-2 py-1 text-xs capitalize"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={analyze}
                        className="w-full rounded-md border border-border px-3 py-2 font-medium hover:bg-secondary"
                      >
                        Analisar novamente
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {showDashboard && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
              <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ChartColumnBig className="size-4 text-primary" />
                    Dashboard de falas
                  </div>
                  <button
                    onClick={() => setShowDashboard(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                    aria-label="Fechar"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
                  {dashboardError ? (
                    <p className="text-destructive">{dashboardError}</p>
                  ) : dashboardLoading ? (
                    <p className="text-muted-foreground">Analisando as falas…</p>
                  ) : dashboard ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-2xl font-semibold">
                            {dashboardStats.words}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Palavras faladas
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-2xl font-semibold">
                            {dashboardStats.segments}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Trechos de fala
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 font-medium">Assuntos mais citados</h3>
                        {dashboard.topics.length === 0 ? (
                          <p className="text-muted-foreground">Nenhum assunto identificado.</p>
                        ) : (
                          <div className="space-y-2">
                            {dashboard.topics.map((t) => {
                              const max = dashboard.topics[0]?.mentions || 1;
                              return (
                                <div key={t.topic}>
                                  <div className="mb-1 flex justify-between text-xs">
                                    <span className="capitalize">{t.topic}</span>
                                    <span className="text-muted-foreground">{t.mentions}x</span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                      className="h-full rounded-full bg-primary"
                                      style={{ width: `${Math.max(6, (t.mentions / max) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="mb-3 font-medium">Palavras-chave</h3>
                        {dashboard.keywords.length === 0 ? (
                          <p className="text-muted-foreground">Nenhuma palavra-chave identificada.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {dashboard.keywords.map((k) => (
                              <span
                                key={k.word}
                                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                              >
                                <Hash className="size-3 text-primary" />
                                {k.word}
                                <span className="text-muted-foreground">{k.count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={openDashboard}
                        className="w-full rounded-md border border-border px-3 py-2 font-medium hover:bg-secondary"
                      >
                        Atualizar
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
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
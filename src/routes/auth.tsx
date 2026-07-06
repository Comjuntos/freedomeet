import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Video } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — FreedoMeet" },
      { name: "description", content: "Acesse o painel de salas de projetos e equipes do FreedoMeet." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app", data: { name } },
        });
        if (error) throw error;
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) navigate({ to: "/app" });
        else setNotice("Conta criada! Verifique seu e-mail para confirmar o acesso.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Video className="size-7 text-primary" />
          <span className="text-xl font-medium">FreedoMeet</span>
        </div>

        <h1 className="text-2xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse o painel de salas de projetos e equipes.
        </p>

        <button
          onClick={google}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Continuar com Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-primary">{notice}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
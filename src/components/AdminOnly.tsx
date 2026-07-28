import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { useAccess } from "@/hooks/use-access";

/** Libera o conteúdo apenas para administradores (assinatura paga ativa). */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAccess();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
        <div className="max-w-md space-y-3">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Lock className="size-6" />
          </span>
          <h1 className="text-xl font-semibold">Recurso de administrador</h1>
          <p className="text-sm text-muted-foreground">
            Esta ferramenta faz parte dos planos pagos. Assine um plano para receber acesso de
            administrador.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Link
              to="/"
              hash="planos"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ver planos
            </Link>
            <Link
              to="/app"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Voltar ao painel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

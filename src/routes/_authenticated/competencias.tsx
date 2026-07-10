import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Target, Plus, Trash2, Sparkles, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/competencias")({
  head: () => ({ meta: [{ title: "Mapa de Competências — FreeduMeet" }] }),
  component: CompetencyTool,
});

type Team = { id: string; name: string };
type Member = { id: string; team_id: string; full_name: string; role: string };
type Competency = {
  id: string;
  team_id: string | null;
  member_id: string | null;
  competency: string;
  why_critical: string | null;
  current_level: number;
  impact: string;
  how_evolve: string | null;
  responsible: string | null;
  deadline: string | null;
};

const IMPACTS = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
];

function impactClass(impact: string) {
  if (impact === "alto") return "bg-rose-500/15 text-rose-600";
  if (impact === "medio") return "bg-amber-500/15 text-amber-600";
  return "bg-emerald-500/15 text-emerald-600";
}

function CompetencyTool() {
  const qc = useQueryClient();

  const teamsQ = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Team[];
    },
  });

  const membersQ = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, team_id, full_name, role");
      if (error) throw error;
      return data as Member[];
    },
  });

  const competenciesQ = useQuery({
    queryKey: ["competency_maps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competency_maps")
        .select(
          "id, team_id, member_id, competency, why_critical, current_level, impact, how_evolve, responsible, deadline",
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Competency[];
    },
  });

  const teams = teamsQ.data ?? [];
  const members = membersQ.data ?? [];
  const competencies = competenciesQ.data ?? [];

  const [team, setTeam] = useState("");
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  const [level, setLevel] = useState(1);
  const [impact, setImpact] = useState("medio");
  const [how, setHow] = useState("");
  const [deadline, setDeadline] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const teamMembers = useMemo(
    () => (team ? members.filter((m) => m.team_id === team) : []),
    [members, team],
  );

  const add = async () => {
    const competency = name.trim();
    if (!competency) {
      toast.error("Informe a competência");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const member = members.find((m) => m.id === memberId);
    const { error } = await supabase.from("competency_maps").insert({
      owner_id: u.user.id,
      team_id: team || null,
      member_id: memberId || null,
      competency,
      why_critical: why.trim() || null,
      current_level: level,
      impact,
      how_evolve: how.trim() || null,
      responsible: member?.full_name ?? null,
      deadline: deadline || null,
    });
    if (error) {
      toast.error("Não foi possível adicionar a competência");
      return;
    }
    setName("");
    setWhy("");
    setLevel(1);
    setImpact("medio");
    setHow("");
    setDeadline("");
    qc.invalidateQueries({ queryKey: ["competency_maps"] });
    toast.success("Competência mapeada");
  };

  const update = async (id: string, patch: Partial<Competency>) => {
    await supabase.from("competency_maps").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["competency_maps"] });
  };

  const remove = async (id: string) => {
    await supabase.from("competency_maps").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["competency_maps"] });
    toast.success("Competência removida");
  };

  const visible = teamFilter
    ? competencies.filter((c) => c.team_id === teamFilter)
    : competencies;

  // Group by member (unassigned competencies grouped under "Equipe")
  const groups = useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of visible) {
      const key = c.member_id ?? "__team__";
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar ao painel
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Ferramenta de IA
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Mapa de Competências</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mapeie as habilidades e competências de cada membro da equipe. Selecione um membro
              para atribuir competências individuais ou deixe em branco para a equipe toda.
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Nova competência
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <select
              value={team}
              onChange={(e) => {
                setTeam(e.target.value);
                setMemberId("");
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Sem equipe</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              disabled={!team}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">Toda a equipe</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Competência / habilidade"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Por que é crítica?"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
            />
            <input
              value={how}
              onChange={(e) => setHow(e.target.value)}
              placeholder="Como vamos evoluir?"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Nível</span>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Nível {n}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {IMPACTS.map((i) => (
                <option key={i.value} value={i.value}>
                  Impacto {i.label}
                </option>
              ))}
            </select>
            <button
              onClick={add}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:col-span-2"
            >
              <Plus className="size-4" /> Adicionar competência
            </button>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Competências mapeadas</h2>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Todas as equipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {groups.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma competência mapeada ainda.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {groups.map(([key, items]) => {
              const member = members.find((m) => m.id === key);
              const teamName = teams.find(
                (t) => t.id === (member?.team_id ?? items[0]?.team_id),
              )?.name;
              return (
                <div key={key} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <User className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{member?.full_name ?? "Equipe (geral)"}</p>
                      {teamName && (
                        <p className="text-xs text-muted-foreground">{teamName}</p>
                      )}
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {items.length} competência(s)
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((c) => (
                      <div key={c.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{c.competency}</p>
                          <button
                            onClick={() => remove(c.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive"
                            aria-label="Remover"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        {c.why_critical && (
                          <p className="mt-1 text-xs text-muted-foreground">{c.why_critical}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => update(c.id, { current_level: n })}
                                aria-label={`Nível ${n}`}
                                className={`size-6 rounded-full text-xs font-medium ${
                                  n <= c.current_level
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <select
                            value={c.impact}
                            onChange={(e) => update(c.id, { impact: e.target.value })}
                            className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${impactClass(
                              c.impact,
                            )}`}
                          >
                            {IMPACTS.map((i) => (
                              <option key={i.value} value={i.value}>
                                {i.label}
                              </option>
                            ))}
                          </select>
                          {c.deadline && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.deadline + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        {c.how_evolve && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Evolução: </span>
                            {c.how_evolve}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

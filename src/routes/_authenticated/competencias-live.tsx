import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
} from "recharts";
import { ArrowLeft, Activity, Target, TrendingUp, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AdminOnly } from "@/components/AdminOnly";

export const Route = createFileRoute("/_authenticated/competencias-live")({
  head: () => ({ meta: [{ title: "Painel Live de Competências — FreeduMeet" }] }),
  component: () => (
    <AdminOnly>
      <CompetencyLive />
    </AdminOnly>
  ),
});

type Member = { id: string; full_name: string };
type Competency = {
  id: string;
  member_id: string | null;
  competency: string;
  current_level: number;
  impact: string;
};

const IMPACT_COLORS: Record<string, string> = {
  alto: "hsl(346 77% 55%)",
  medio: "hsl(38 92% 50%)",
  baixo: "hsl(152 60% 45%)",
};
const IMPACT_LABELS: Record<string, string> = {
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

function CompetencyLive() {
  const competenciesQ = useQuery({
    queryKey: ["competency_maps"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competency_maps")
        .select("id, member_id, competency, current_level, impact")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Competency[];
    },
  });

  const membersQ = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, full_name");
      if (error) throw error;
      return data as Member[];
    },
  });

  const competencies = competenciesQ.data ?? [];
  const members = membersQ.data ?? [];

  const stats = useMemo(() => {
    const total = competencies.length;
    const avg =
      total > 0
        ? competencies.reduce((s, c) => s + c.current_level, 0) / total
        : 0;
    const high = competencies.filter((c) => c.impact === "alto").length;
    const people = new Set(
      competencies.filter((c) => c.member_id).map((c) => c.member_id),
    ).size;
    return { total, avg, high, people };
  }, [competencies]);

  const byImpact = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of competencies) map.set(c.impact, (map.get(c.impact) ?? 0) + 1);
    return ["alto", "medio", "baixo"].map((k) => ({
      name: IMPACT_LABELS[k],
      key: k,
      value: map.get(k) ?? 0,
    }));
  }, [competencies]);

  const byMember = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    for (const c of competencies) {
      if (!c.member_id) continue;
      const cur = map.get(c.member_id) ?? { sum: 0, n: 0 };
      cur.sum += c.current_level;
      cur.n += 1;
      map.set(c.member_id, cur);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({
        name: members.find((m) => m.id === id)?.full_name ?? "—",
        media: Number((v.sum / v.n).toFixed(1)),
        count: v.n,
      }))
      .sort((a, b) => b.media - a.media);
  }, [competencies, members]);

  const radar = useMemo(
    () =>
      competencies.slice(0, 8).map((c) => ({
        competency:
          c.competency.length > 14 ? c.competency.slice(0, 14) + "…" : c.competency,
        nivel: c.current_level,
      })),
    [competencies],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/competencias"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar ao mapa
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Ao vivo
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Painel Live de Competências</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visão em tempo real das competências mapeadas. Atualiza automaticamente.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Target, label: "Competências", value: stats.total },
            { icon: TrendingUp, label: "Nível médio", value: stats.avg.toFixed(1) },
            { icon: Activity, label: "Impacto alto", value: stats.high },
            { icon: Users, label: "Pessoas mapeadas", value: stats.people },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <s.icon className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Nível médio por pessoa</h2>
            <div className="mt-4 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMember} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" domain={[0, 5]} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    fontSize={12}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="media"
                    fill="var(--primary)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Distribuição por impacto</h2>
            <div className="mt-4 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byImpact.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {byImpact
                      .filter((d) => d.value > 0)
                      .map((d) => (
                        <Cell key={d.key} fill={IMPACT_COLORS[d.key]} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4">
              {byImpact.map((d) => (
                <span key={d.key} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: IMPACT_COLORS[d.key] }}
                  />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold">Radar de competências</h2>
            <div className="mt-4 h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar}>
                  <PolarGrid opacity={0.3} />
                  <PolarAngleAxis dataKey="competency" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 5]} fontSize={10} />
                  <Radar
                    dataKey="nivel"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.35}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
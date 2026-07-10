import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Video,
  Plus,
  Trash2,
  Users,
  LogOut,
  DoorOpen,
  History,
  Search,
  BarChart3,
  CalendarClock,
  Power,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Painel — FreeduMeet" }] }),
  component: Dashboard,
});

type Team = { id: string; name: string };
type Member = {
  id: string;
  team_id: string;
  full_name: string;
  email: string | null;
  role: string;
};
type Room = { id: string; name: string; room_slug: string };
type MeetingRecord = {
  id: string;
  title: string;
  team_id: string | null;
  minutes: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  sentiment: unknown;
  dashboard: unknown;
};
type Schedule = {
  id: string;
  title: string;
  team_id: string | null;
  room_slug: string;
  weekday: number;
  time_of_day: string;
  active: boolean;
};

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function nextOccurrence(weekday: number, time: string): Date {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const now = new Date();
  const d = new Date(now);
  d.setHours(h || 0, m || 0, 0, 0);
  let diff = (weekday - now.getDay() + 7) % 7;
  if (diff === 0 && d.getTime() <= now.getTime()) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "sala"}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function Dashboard() {
  const navigate = useNavigate();
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
        .select("id, team_id, full_name, email, role");
      if (error) throw error;
      return data as Member[];
    },
  });

  const roomsQ = useQuery({
    queryKey: ["project_rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_rooms")
        .select("id, name, room_slug")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Room[];
    },
  });

  const roomTeamsQ = useQuery({
    queryKey: ["room_teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("room_teams").select("room_id, team_id");
      if (error) throw error;
      return data as { room_id: string; team_id: string }[];
    },
  });

  const recordsQ = useQuery({
    queryKey: ["meeting_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_records")
        .select("id, title, team_id, minutes, created_at, started_at, ended_at, sentiment, dashboard")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MeetingRecord[];
    },
  });

  const schedulesQ = useQuery({
    queryKey: ["scheduled_meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_meetings")
        .select("id, title, team_id, room_slug, weekday, time_of_day, active")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const [teamName, setTeamName] = useState("");
  const [memberInputs, setMemberInputs] = useState<Record<string, string>>({});
  const [roomName, setRoomName] = useState("");
  const [roomTeamSel, setRoomTeamSel] = useState<Record<string, boolean>>({});
  const [histTeam, setHistTeam] = useState("");
  const [histFrom, setHistFrom] = useState("");
  const [histTo, setHistTo] = useState("");
  const [histSearch, setHistSearch] = useState("");
  const [openRecord, setOpenRecord] = useState<MeetingRecord | null>(null);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedRoom, setSchedRoom] = useState("");
  const [schedTeam, setSchedTeam] = useState("");
  const [schedWeekday, setSchedWeekday] = useState(1);
  const [schedTime, setSchedTime] = useState("09:00");
  const [repTeam, setRepTeam] = useState("");

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const addTeam = async () => {
    const name = teamName.trim();
    if (!name) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("teams").insert({ name, owner_id: u.user.id });
    if (!error) {
      setTeamName("");
      qc.invalidateQueries({ queryKey: ["teams"] });
    }
  };

  const deleteTeam = async (id: string) => {
    await supabase.from("teams").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["teams"] });
    qc.invalidateQueries({ queryKey: ["team_members"] });
  };

  const addMember = async (teamId: string) => {
    const raw = (memberInputs[teamId] || "").trim();
    if (!raw) return;
    const [full_name, email] = raw.split("|").map((s) => s.trim());
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, full_name, email: email || null });
    if (!error) {
      setMemberInputs((m) => ({ ...m, [teamId]: "" }));
      qc.invalidateQueries({ queryKey: ["team_members"] });
    }
  };

  const deleteMember = async (id: string) => {
    await supabase.from("team_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_members"] });
  };

  const setMemberRole = async (id: string, role: string) => {
    await supabase.from("team_members").update({ role }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_members"] });
  };

  const addRoom = async () => {
    const name = roomName.trim();
    if (!name) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const room_slug = slugify(name);
    const { data, error } = await supabase
      .from("project_rooms")
      .insert({ name, room_slug, owner_id: u.user.id })
      .select("id")
      .single();
    if (error || !data) return;
    const teamIds = Object.keys(roomTeamSel).filter((k) => roomTeamSel[k]);
    if (teamIds.length > 0) {
      await supabase
        .from("room_teams")
        .insert(teamIds.map((team_id) => ({ room_id: data.id, team_id })));
    }
    setRoomName("");
    setRoomTeamSel({});
    qc.invalidateQueries({ queryKey: ["project_rooms"] });
    qc.invalidateQueries({ queryKey: ["room_teams"] });
  };

  const deleteRoom = async (id: string) => {
    await supabase.from("project_rooms").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["project_rooms"] });
    qc.invalidateQueries({ queryKey: ["room_teams"] });
  };

  const deleteRecord = async (id: string) => {
    await supabase.from("meeting_records").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["meeting_records"] });
  };

  const addSchedule = async () => {
    const title = schedTitle.trim();
    if (!title || !schedRoom) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const room = rooms.find((r) => r.id === schedRoom);
    if (!room) return;
    const next_at = nextOccurrence(schedWeekday, schedTime).toISOString();
    const { error } = await supabase.from("scheduled_meetings").insert({
      owner_id: u.user.id,
      title,
      room_id: room.id,
      room_slug: room.room_slug,
      team_id: schedTeam || null,
      weekday: schedWeekday,
      time_of_day: schedTime,
      next_at,
    });
    if (!error) {
      setSchedTitle("");
      setSchedRoom("");
      setSchedTeam("");
      qc.invalidateQueries({ queryKey: ["scheduled_meetings"] });
    }
  };

  const toggleSchedule = async (id: string, active: boolean) => {
    await supabase.from("scheduled_meetings").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["scheduled_meetings"] });
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("scheduled_meetings").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["scheduled_meetings"] });
  };

  const openRoom = (slug: string) => {
    sessionStorage.setItem(`freedomeet-host-${slug}`, "1");
    navigate({ to: "/room/$roomId", params: { roomId: slug } });
  };

  const teams = teamsQ.data ?? [];
  const members = membersQ.data ?? [];
  const rooms = roomsQ.data ?? [];
  const roomTeams = roomTeamsQ.data ?? [];
  const records = recordsQ.data ?? [];
  const schedules = schedulesQ.data ?? [];

  const filteredRecords = records.filter((r) => {
    if (histTeam && r.team_id !== histTeam) return false;
    const date = (r.started_at ?? r.created_at).slice(0, 10);
    if (histFrom && date < histFrom) return false;
    if (histTo && date > histTo) return false;
    if (histSearch) {
      const q = histSearch.toLowerCase();
      const hay = `${r.title} ${r.minutes ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const reportRecords = records.filter((r) => !repTeam || r.team_id === repTeam);
  const totalMeetings = reportRecords.length;
  const totalMinutes = reportRecords.reduce((acc, r) => {
    if (r.started_at && r.ended_at) {
      return acc + Math.max(0, (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 60000);
    }
    return acc;
  }, 0);
  const sentScores = reportRecords
    .map((r) => (r.sentiment as { score?: number } | null)?.score)
    .filter((s): s is number => typeof s === "number");
  const avgSentiment = sentScores.length
    ? Math.round(sentScores.reduce((a, b) => a + b, 0) / sentScores.length)
    : null;
  const topicCounts = new Map<string, number>();
  for (const r of reportRecords) {
    const topics = (r.dashboard as { topics?: { topic: string; mentions: number }[] } | null)?.topics;
    if (Array.isArray(topics)) {
      for (const t of topics) {
        if (t?.topic) topicCounts.set(t.topic, (topicCounts.get(t.topic) ?? 0) + (t.mentions || 1));
      }
    }
  }
  const topTopics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxTopic = topTopics[0]?.[1] ?? 1;

  return (
    <div className="aurora-bg min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent glow">
            <Video className="size-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-semibold">FreeduMeet — Painel</span>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
        >
          <LogOut className="size-4" /> Sair
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-8 lg:grid-cols-2">
        {/* EQUIPES */}
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Users className="size-5 text-primary" /> Equipes
          </h2>
          <div className="mt-4 flex gap-2">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nome da equipe"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={addTeam}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> Criar
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {teams.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma equipe ainda.</p>
            )}
            {teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Excluir equipe"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {members
                    .filter((m) => m.team_id === team.id)
                    .map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between text-sm text-muted-foreground"
                      >
                        <span>
                          {m.full_name}
                          {m.email ? ` · ${m.email}` : ""}
                        </span>
                        <span className="flex items-center gap-2">
                          <select
                            value={m.role}
                            onChange={(e) => setMemberRole(m.id, e.target.value)}
                            className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                            aria-label="Papel do membro"
                          >
                            <option value="membro">Membro</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => deleteMember(m.id)}
                            className="rounded p-0.5 hover:text-destructive"
                            aria-label="Remover membro"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input
                    value={memberInputs[team.id] || ""}
                    onChange={(e) =>
                      setMemberInputs((mi) => ({ ...mi, [team.id]: e.target.value }))
                    }
                    placeholder="Nome completo | email (opcional)"
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => addMember(team.id)}
                    className="rounded-md border border-border px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SALAS */}
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <DoorOpen className="size-5 text-primary" /> Salas de projeto
          </h2>
          <div className="mt-4 rounded-lg border border-border p-4">
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Nome da sala"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {teams.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Equipes que participam:
                </p>
                <div className="flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={!!roomTeamSel[team.id]}
                        onChange={(e) =>
                          setRoomTeamSel((s) => ({ ...s, [team.id]: e.target.checked }))
                        }
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={addRoom}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> Criar sala
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma sala ainda.</p>
            )}
            {rooms.map((room) => {
              const linked = roomTeams
                .filter((rt) => rt.room_id === room.id)
                .map((rt) => teams.find((t) => t.id === rt.team_id)?.name)
                .filter(Boolean);
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {linked.length > 0 ? linked.join(", ") : "Sem equipes"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openRoom(room.room_slug)}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Video className="size-4" /> Abrir
                    </button>
                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir sala"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HISTÓRICO DE REUNIÕES */}
        <section className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <History className="size-5 text-primary" /> Histórico de reuniões
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Equipe</span>
              <select
                value={histTeam}
                onChange={(e) => setHistTeam(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">De</span>
              <input
                type="date"
                value={histFrom}
                onChange={(e) => setHistFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Até</span>
              <input
                type="date"
                value={histTo}
                onChange={(e) => setHistTo(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Buscar</span>
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  placeholder="Título ou conteúdo da ata"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {filteredRecords.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma reunião no histórico ainda. Salve a ata ao final de uma reunião.
              </p>
            )}
            {filteredRecords.map((r) => {
              const teamName = teams.find((t) => t.id === r.team_id)?.name;
              const date = new Date(r.started_at ?? r.created_at).toLocaleString("pt-BR");
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {date}
                      {teamName ? ` · ${teamName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOpenRecord(r)}
                      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
                    >
                      Ver ata
                    </button>
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir registro"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RELATÓRIOS DE ENGAJAMENTO */}
        <section className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <BarChart3 className="size-5 text-primary" /> Relatórios de engajamento
          </h2>
          <div className="mt-4 rounded-lg border border-border p-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Equipe</span>
              <select
                value={repTeam}
                onChange={(e) => setRepTeam(e.target.value)}
                className="w-56 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Reuniões</p>
                <p className="text-2xl font-semibold">{totalMeetings}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Tempo total</p>
                <p className="text-2xl font-semibold">
                  {Math.round(totalMinutes)} <span className="text-sm font-normal">min</span>
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Sentimento médio</p>
                <p className="text-2xl font-semibold">
                  {avgSentiment === null ? "—" : `${avgSentiment}/100`}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Tópicos recorrentes</p>
              {topTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem dados. Salve reuniões com análise para gerar relatórios.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {topTopics.map(([topic, count]) => (
                    <li key={topic} className="flex items-center gap-2 text-sm">
                      <span className="w-40 shrink-0 truncate">{topic}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / maxTopic) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* AGENDA DE REUNIÕES RECORRENTES */}
        <section className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <CalendarClock className="size-5 text-primary" /> Agenda recorrente
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <input
              value={schedTitle}
              onChange={(e) => setSchedTitle(e.target.value)}
              placeholder="Título da reunião"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <select
              value={schedRoom}
              onChange={(e) => setSchedRoom(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-2 text-sm"
            >
              <option value="">Sala…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={schedTeam}
              onChange={(e) => setSchedTeam(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-2 text-sm"
            >
              <option value="">Equipe (opcional)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={schedWeekday}
              onChange={(e) => setSchedWeekday(Number(e.target.value))}
              className="rounded-md border border-border bg-background px-2 py-2 text-sm"
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={schedTime}
              onChange={(e) => setSchedTime(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-2 text-sm"
            />
            <button
              onClick={addSchedule}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> Agendar
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {schedules.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma reunião recorrente ainda.</p>
            )}
            {schedules.map((s) => {
              const teamName = teams.find((t) => t.id === s.team_id)?.name;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {s.title}
                      {!s.active && (
                        <span className="ml-2 text-xs text-muted-foreground">(pausada)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toda {WEEKDAYS[s.weekday]} às {s.time_of_day}
                      {teamName ? ` · ${teamName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openRoom(s.room_slug)}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Video className="size-4" /> Abrir
                    </button>
                    <button
                      onClick={() => toggleSchedule(s.id, s.active)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Pausar/retomar"
                    >
                      <Power className="size-4" />
                    </button>
                    <button
                      onClick={() => deleteSchedule(s.id)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir agendamento"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {openRecord && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpenRecord(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-medium">{openRecord.title}</span>
              <button
                onClick={() => setOpenRecord(null)}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-secondary"
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
              {openRecord.minutes ? (
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {openRecord.minutes}
                </pre>
              ) : (
                <p className="text-muted-foreground">Sem ata registrada para esta reunião.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
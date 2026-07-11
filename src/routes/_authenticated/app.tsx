import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
  Target,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Painel — FreeduMeet" }] }),
  component: Dashboard,
});

const initials = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

function MemberAvatar({
  member,
  url,
  className = "size-8",
  ringClass,
}: {
  member: { full_name: string };
  url: string;
  className?: string;
  ringClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ${className} ${ringClass ?? ""}`}
      >
        {initials(member.full_name)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={`Avatar de ${member.full_name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-background ${className} ${ringClass ?? ""}`}
    />
  );
}

type Team = { id: string; name: string };
type Activity = {
  id: string;
  team_id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  member_id: string | null;
  status: string;
};
type Member = {
  id: string;
  team_id: string;
  full_name: string;
  email: string | null;
  role: string;
  activity: string | null;
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
        .select("id, team_id, full_name, email, role, activity");
      if (error) throw error;
      return data as Member[];
    },
  });

  const activitiesQ = useQuery({
    queryKey: ["team_activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_activities")
        .select("id, team_id, title, due_date, done, member_id, status")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Activity[];
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

  const [teamName, setTeamName] = useState("");
  const [memberInputs, setMemberInputs] = useState<Record<string, string>>({});
  const [memberSearch, setMemberSearch] = useState("");
  const [dragMember, setDragMember] = useState<string | null>(null);
  const [dragOverTeam, setDragOverTeam] = useState<string | null>(null);
  const [dragAct, setDragAct] = useState<string | null>(null);
  const [dragLane, setDragLane] = useState<string | null>(null);
  const [editAct, setEditAct] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMember, setEditMember] = useState("");
  const [profileMember, setProfileMember] = useState<Member | null>(null);
  const [actTitle, setActTitle] = useState<Record<string, string>>({});
  const [actDate, setActDate] = useState<Record<string, string>>({});
  const [actMember, setActMember] = useState<Record<string, string>>({});
  const [filterMember, setFilterMember] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<Record<string, string>>({});
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
  const [compTeam, setCompTeam] = useState("");
  const [compName, setCompName] = useState("");
  const [compWhy, setCompWhy] = useState("");
  const [compLevel, setCompLevel] = useState(1);
  const [compImpact, setCompImpact] = useState("medio");
  const [compHow, setCompHow] = useState("");
  const [compResp, setCompResp] = useState("");
  const [compDeadline, setCompDeadline] = useState("");

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
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
      toast.success(`Equipe "${name}" criada`);
    } else {
      toast.error("Não foi possível criar a equipe");
    }
  };

  const deleteTeam = async (id: string) => {
    await supabase.from("teams").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["teams"] });
    qc.invalidateQueries({ queryKey: ["team_members"] });
    toast.success("Equipe excluída");
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
      toast.success(`${full_name} adicionado`);
    } else {
      toast.error("Não foi possível adicionar o membro");
    }
  };

  const deleteMember = async (id: string) => {
    await supabase.from("team_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_members"] });
    toast.success("Membro removido");
  };

  const setMemberRole = async (id: string, role: string) => {
    await supabase.from("team_members").update({ role }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_members"] });
    toast.success(`Papel alterado para ${role}`);
  };

  const setMemberActivity = async (id: string, activity: string) => {
    await supabase
      .from("team_members")
      .update({ activity: activity.trim() || null })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_members"] });
  };

  const addActivity = async (teamId: string) => {
    const title = (actTitle[teamId] || "").trim();
    if (!title) return;
    const { error } = await supabase.from("team_activities").insert({
      team_id: teamId,
      title,
      due_date: actDate[teamId] || null,
      member_id: actMember[teamId] || null,
    });
    if (!error) {
      setActTitle((s) => ({ ...s, [teamId]: "" }));
      setActDate((s) => ({ ...s, [teamId]: "" }));
      setActMember((s) => ({ ...s, [teamId]: "" }));
      qc.invalidateQueries({ queryKey: ["team_activities"] });
      toast.success("Atividade criada");
    } else {
      toast.error("Não foi possível criar a atividade");
    }
  };

  const toggleActivity = async (id: string, done: boolean) => {
    await supabase.from("team_activities").update({ done }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_activities"] });
  };

  const setActivityStatus = async (id: string, status: string) => {
    await supabase
      .from("team_activities")
      .update({ status, done: status === "done" })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_activities"] });
  };

  const deleteActivity = async (id: string) => {
    await supabase.from("team_activities").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_activities"] });
    toast.success("Atividade removida");
  };

  const moveMember = async (id: string, teamId: string) => {
    setDragOverTeam(null);
    setDragMember(null);
    const name = members.find((m) => m.id === id)?.full_name ?? "Membro";
    const team = teams.find((t) => t.id === teamId)?.name ?? "";
    await supabase.from("team_members").update({ team_id: teamId }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["team_members"] });
    toast.success(`${name} movido para "${team}"`);
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

  const addCompetency = async () => {
    const competency = compName.trim();
    if (!competency) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("competency_maps").insert({
      owner_id: u.user.id,
      team_id: compTeam || null,
      competency,
      why_critical: compWhy.trim() || null,
      current_level: compLevel,
      impact: compImpact,
      how_evolve: compHow.trim() || null,
      responsible: compResp.trim() || null,
      deadline: compDeadline || null,
    });
    if (!error) {
      setCompName("");
      setCompWhy("");
      setCompLevel(1);
      setCompImpact("medio");
      setCompHow("");
      setCompResp("");
      setCompDeadline("");
      qc.invalidateQueries({ queryKey: ["competency_maps"] });
      toast.success("Competência adicionada ao mapa");
    } else {
      toast.error("Não foi possível adicionar a competência");
    }
  };

  const updateCompetency = async (id: string, patch: Partial<Competency>) => {
    await supabase.from("competency_maps").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["competency_maps"] });
  };

  const deleteCompetency = async (id: string) => {
    await supabase.from("competency_maps").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["competency_maps"] });
    toast.success("Competência removida");
  };

  const teams = teamsQ.data ?? [];
  const members = membersQ.data ?? [];
  const activities = activitiesQ.data ?? [];
  const rooms = roomsQ.data ?? [];
  const roomTeams = roomTeamsQ.data ?? [];
  const records = recordsQ.data ?? [];
  const schedules = schedulesQ.data ?? [];
  const competencies = competenciesQ.data ?? [];

  const COLUMN_COLORS = [
    { bar: "bg-sky-500", tint: "bg-sky-500/10", ring: "ring-sky-500/30" },
    { bar: "bg-violet-500", tint: "bg-violet-500/10", ring: "ring-violet-500/30" },
    { bar: "bg-emerald-500", tint: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
    { bar: "bg-amber-500", tint: "bg-amber-500/10", ring: "ring-amber-500/30" },
    { bar: "bg-rose-500", tint: "bg-rose-500/10", ring: "ring-rose-500/30" },
    { bar: "bg-cyan-500", tint: "bg-cyan-500/10", ring: "ring-cyan-500/30" },
  ];
  const avatarUrlFor = (seed: string) =>
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
      seed.trim().toLowerCase(),
    )}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

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
      <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-6 py-4">
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
        <section className="min-w-0 lg:col-span-2">
          <TooltipProvider>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Users className="size-5 text-primary" /> Quadro de equipes
            </h2>
            <div className="flex gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nome da equipe"
                className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={addTeam}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4" /> Nova lista
              </button>
            </div>
          </div>

          {teams.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma equipe ainda.</p>
          )}

          {teams.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Buscar membro por nome ou email…"
                className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <span>
                {teams.length} {teams.length === 1 ? "equipe" : "equipes"} ·{" "}
                {members.length} {members.length === 1 ? "membro" : "membros"}
              </span>
            </div>
          )}

          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {teams.map((team, ti) => {
              const q = memberSearch.trim().toLowerCase();
              const teamMembers = members
                .filter((m) => m.team_id === team.id)
                .filter(
                  (m) =>
                    !q ||
                    m.full_name.toLowerCase().includes(q) ||
                    (m.email ?? "").toLowerCase().includes(q),
                );
              const adminCount = teamMembers.filter((m) => m.role === "admin").length;
              const c = COLUMN_COLORS[ti % COLUMN_COLORS.length];
              return (
                <div
                  key={team.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverTeam !== team.id) setDragOverTeam(team.id);
                  }}
                  onDragLeave={() => setDragOverTeam((t) => (t === team.id ? null : t))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = dragMember || e.dataTransfer.getData("text/plain");
                    if (id) moveMember(id, team.id);
                  }}
                  className={`flex w-72 shrink-0 flex-col overflow-hidden rounded-xl ${c.tint} ring-1 ${
                    dragOverTeam === team.id ? "ring-2 ring-primary" : c.ring
                  }`}
                >
                  <div className={`h-1.5 w-full ${c.bar}`} />
                  <div className="flex flex-col p-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className={`inline-block size-2.5 rounded-full ${c.bar}`} />
                      {team.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {teamMembers.length}
                      </span>
                      {adminCount > 0 && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600">
                          {adminCount} admin{adminCount > 1 ? "s" : ""}
                        </span>
                      )}
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Excluir equipe"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {teamMembers.length === 0 && (
                      <p className="px-1 text-xs text-muted-foreground">
                        Sem membros ainda.
                      </p>
                    )}
                    {teamMembers.map((m) => (
                      <div
                        key={m.id}
                        draggable
                        onDragStart={(e) => {
                          setDragMember(m.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", m.id);
                        }}
                        onDragEnd={() => setDragMember(null)}
                        className={`cursor-grab rounded-lg border border-border bg-background p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                          dragMember === m.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setProfileMember(m)}
                                  aria-label={`Ver perfil de ${m.full_name}`}
                                  className="rounded-full"
                                >
                                  <MemberAvatar
                                    member={m}
                                    url={avatarUrlFor(m.email || m.full_name)}
                                    className="size-8"
                                    ringClass={`ring-2 ${c.ring}`}
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Ver perfil de {m.full_name}</TooltipContent>
                            </Tooltip>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{m.full_name}</p>
                              {m.email && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {m.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteMember(m.id)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                            aria-label="Remover membro"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <select
                          value={m.role}
                          onChange={(e) => setMemberRole(m.id, e.target.value)}
                          className={`mt-2 rounded-full border-0 px-2 py-0.5 text-xs font-medium ${
                            m.role === "admin"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-secondary text-muted-foreground"
                          }`}
                          aria-label="Papel do membro"
                        >
                          <option value="membro">Membro</option>
                          <option value="admin">Admin</option>
                        </select>
                        <div className="mt-2">
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Atividades
                          </label>
                          <textarea
                            key={m.activity ?? ""}
                            defaultValue={m.activity ?? ""}
                            rows={3}
                            onBlur={(e) => {
                              if ((e.target.value.trim() || null) !== (m.activity ?? null))
                                setMemberActivity(m.id, e.target.value);
                            }}
                            placeholder="Descreva o que está sendo realizado…"
                            className="min-h-[64px] w-full resize-y rounded-md border border-dashed border-border bg-secondary/40 px-2.5 py-2 text-xs leading-relaxed outline-none transition-colors focus:border-primary focus:bg-background"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={memberInputs[team.id] || ""}
                      onChange={(e) =>
                        setMemberInputs((mi) => ({ ...mi, [team.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addMember(team.id);
                      }}
                      placeholder="Nome | email (opcional)"
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => addMember(team.id)}
                      className="rounded-md bg-background px-2 py-1.5 text-sm hover:bg-background/70"
                      aria-label="Adicionar membro"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarClock className="size-3.5" /> Atividades & prazos
                    </p>
                    {teamMembers.length > 0 && (
                      <select
                        value={filterMember[team.id] || ""}
                        onChange={(e) =>
                          setFilterMember((s) => ({ ...s, [team.id]: e.target.value }))
                        }
                        className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
                        aria-label="Filtrar por membro"
                      >
                        <option value="">Todos os membros</option>
                        {teamMembers.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.full_name}
                          </option>
                        ))}
                      </select>
                    )}
                    <select
                      value={filterStatus[team.id] || ""}
                      onChange={(e) =>
                        setFilterStatus((s) => ({ ...s, [team.id]: e.target.value }))
                      }
                      className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
                      aria-label="Filtrar por situação"
                    >
                      <option value="">Todas as situações</option>
                      <option value="todo">A Fazer</option>
                      <option value="doing">Fazendo</option>
                      <option value="done">Feito</option>
                    </select>
                    {(() => {
                      const today = new Date().toISOString().slice(0, 10);
                      const teamActs = activities.filter((a) => a.team_id === team.id);
                      const total = teamActs.length;
                      const doneCount = teamActs.filter((a) => a.done).length;
                      const lateCount = teamActs.filter(
                        (a) => !a.done && a.due_date && a.due_date < today,
                      ).length;
                      if (total === 0) return null;
                      const donePct = (doneCount / total) * 100;
                      const latePct = (lateCount / total) * 100;
                      return (
                        <div className="mb-2">
                          {lateCount > 0 && (
                            <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                              ⚠ {lateCount} aviso{lateCount > 1 ? "s" : ""} de atraso
                            </p>
                          )}
                          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="bg-emerald-500" style={{ width: `${donePct}%` }} />
                            <div className="bg-destructive" style={{ width: `${latePct}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {doneCount}/{total} concluídas
                            {lateCount > 0 && (
                              <span className="text-destructive"> · {lateCount} atrasada{lateCount > 1 ? "s" : ""}</span>
                            )}
                          </p>
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      {(
                        [
                          { key: "todo", label: "A Fazer", next: "doing" },
                          { key: "doing", label: "Fazendo", next: "done" },
                          { key: "done", label: "Feito", next: "todo" },
                        ] as const
                      ).map((lane) => {
                        if (filterStatus[team.id] && filterStatus[team.id] !== lane.key)
                          return null;
                        const laneActs = activities.filter(
                          (a) =>
                            a.team_id === team.id &&
                            (a.status || "todo") === lane.key &&
                            (!filterMember[team.id] || a.member_id === filterMember[team.id]),
                        );
                        return (
                          <div key={lane.key}>
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {lane.label} · {laneActs.length}
                            </p>
                            <div className="space-y-1.5">
                              {laneActs.map((a) => {
                                const overdue =
                                  a.status !== "done" &&
                                  a.due_date &&
                                  a.due_date < new Date().toISOString().slice(0, 10);
                                return (
                                  <div
                                    key={a.id}
                                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                                  >
                                    <button
                                      onClick={() => setActivityStatus(a.id, lane.next)}
                                      className="shrink-0 rounded px-1 text-[10px] text-muted-foreground hover:text-primary"
                                      aria-label="Mover atividade"
                                    >
                                      →
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`truncate text-xs ${a.status === "done" ? "text-muted-foreground line-through" : ""}`}
                                      >
                                        {a.title}
                                      </p>
                                      {a.due_date && (
                                        <p
                                          className={`text-[10px] ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}
                                        >
                                          {new Date(a.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                                          {overdue ? " · atrasada" : ""}
                                        </p>
                                      )}
                                      {a.member_id && (
                                        <p className="truncate text-[10px] text-primary">
                                          @{members.find((m) => m.id === a.member_id)?.full_name ?? "?"}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => deleteActivity(a.id)}
                                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                                      aria-label="Remover atividade"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <input
                        value={actTitle[team.id] || ""}
                        onChange={(e) =>
                          setActTitle((s) => ({ ...s, [team.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addActivity(team.id);
                        }}
                        placeholder="Nova atividade…"
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      />
                      <select
                        value={actMember[team.id] || ""}
                        onChange={(e) =>
                          setActMember((s) => ({ ...s, [team.id]: e.target.value }))
                        }
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                        aria-label="Responsável pela atividade"
                      >
                        <option value="">Sem responsável</option>
                        {teamMembers.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.full_name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={actDate[team.id] || ""}
                          onChange={(e) =>
                            setActDate((s) => ({ ...s, [team.id]: e.target.value }))
                          }
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => addActivity(team.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="size-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
          </TooltipProvider>

          <Dialog
            open={!!profileMember}
            onOpenChange={(o) => !o && setProfileMember(null)}
          >
            <DialogContent>
              {profileMember && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <MemberAvatar
                        member={profileMember}
                        url={avatarUrlFor(
                          profileMember.email || profileMember.full_name,
                        )}
                        className="size-12"
                      />
                      {profileMember.full_name}
                    </DialogTitle>
                    <DialogDescription>
                      {profileMember.email || "Sem email cadastrado"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Papel: </span>
                      <span className="font-medium capitalize">
                        {profileMember.role}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Equipe: </span>
                      <span className="font-medium">
                        {teams.find((t) => t.id === profileMember.team_id)?.name ??
                          "—"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarClock className="size-3.5" /> Atividades atribuídas
                    </p>
                    <div className="space-y-1.5">
                      {activities.filter((a) => a.member_id === profileMember.id).length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhuma atividade atribuída.</p>
                      )}
                      {activities
                        .filter((a) => a.member_id === profileMember.id)
                        .map((a) => {
                          const overdue =
                            !a.done &&
                            a.due_date &&
                            a.due_date < new Date().toISOString().slice(0, 10);
                          return (
                            <div
                              key={a.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5"
                            >
                              <span className={`text-xs ${a.done ? "text-muted-foreground line-through" : ""}`}>
                                {a.title}
                              </span>
                              {a.due_date && (
                                <span className={`text-[10px] ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                                  {new Date(a.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                                  {overdue ? " · atrasada" : ""}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
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

        <section className="lg:col-span-2">
          <Link
            to="/competencias"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Target className="size-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Mapa de Competências</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Ferramenta de IA para mapear habilidades e competências de cada membro da equipe.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 self-start rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground group-hover:bg-primary/90 md:self-auto">
              Abrir ferramenta
            </span>
          </Link>
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
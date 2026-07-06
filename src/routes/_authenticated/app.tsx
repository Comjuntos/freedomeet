import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Video, Plus, Trash2, Users, LogOut, DoorOpen } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Painel — FreedoMeet" }] }),
  component: Dashboard,
});

type Team = { id: string; name: string };
type Member = { id: string; team_id: string; full_name: string; email: string | null };
type Room = { id: string; name: string; room_slug: string };

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
        .select("id, team_id, full_name, email");
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

  const [teamName, setTeamName] = useState("");
  const [memberInputs, setMemberInputs] = useState<Record<string, string>>({});
  const [roomName, setRoomName] = useState("");
  const [roomTeamSel, setRoomTeamSel] = useState<Record<string, boolean>>({});

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

  const openRoom = (slug: string) => {
    sessionStorage.setItem(`freedomeet-host-${slug}`, "1");
    navigate({ to: "/room/$roomId", params: { roomId: slug } });
  };

  const teams = teamsQ.data ?? [];
  const members = membersQ.data ?? [];
  const rooms = roomsQ.data ?? [];
  const roomTeams = roomTeamsQ.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Video className="size-6 text-primary" />
          <span className="text-lg font-medium">FreedoMeet — Painel</span>
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
                        <button
                          onClick={() => deleteMember(m.id)}
                          className="rounded p-0.5 hover:text-destructive"
                          aria-label="Remover membro"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
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
      </main>
    </div>
  );
}
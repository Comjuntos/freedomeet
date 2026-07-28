import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTeams from "./tools/list-teams";
import listTeamMembers from "./tools/list-team-members";
import listActivities from "./tools/list-activities";
import createActivity from "./tools/create-activity";
import listCompetencies from "./tools/list-competencies";
import listMeetings from "./tools/list-meetings";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "freedumeet-mcp",
  title: "FreeduMeet",
  version: "0.1.0",
  instructions:
    "Ferramentas do FreeduMeet: consulte equipes, membros, atividades do quadro Kanban, mapa de competências e reuniões gravadas com atas geradas por IA, e crie novas atividades. Todas as ações acontecem na conta do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTeams, listTeamMembers, listActivities, createActivity, listCompetencies, listMeetings],
});
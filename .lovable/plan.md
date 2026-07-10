# Serviços por assinatura de equipe — plano de implementação

O painel já tem **equipes**, **membros**, **salas** e vínculo **sala↔equipe**, além das server functions de IA (ata, sentimento, dashboard, tradução, Slack). Vamos construir as 6 funcionalidades em fases, reaproveitando essa base. Cada fase é independente e testável.

## Fase 1 — Histórico de reuniões por equipe (base de tudo)
Guardar no banco o resultado de cada reunião para consulta posterior.

- Nova tabela `meeting_records`: `room_id`, `team_id` (opcional), `title`, `transcript`, `minutes` (ata em markdown), `sentiment` (json), `dashboard` (json), `started_at`, `ended_at`, `owner_id`.
- Na sala (`room.$roomId.tsx`), ao gerar a ata/análise, adicionar botão **"Salvar no histórico"** que grava o registro.
- No painel, nova aba/seção **"Histórico"**: lista por equipe e por período (filtro de datas), com busca por título/texto e visualização da ata salva.

## Fase 2 — Convites e papéis (admin/membro) por equipe
- Adicionar coluna `role` em `team_members` (`admin` | `membro`, padrão `membro`).
- Vincular membro a uma conta real via `user_id` (opcional) para reconhecer quem entra.
- Fluxo de convite simples: gerar um link/código de convite por equipe; ao aceitar (logado), o usuário vira `team_members` daquela equipe.
- No painel, seletor de papel por membro e ações restritas a admins.

## Fase 3 — Agenda de reuniões recorrentes com link fixo
- Nova tabela `scheduled_meetings`: `room_id` (link fixo = `room_slug` da sala), `team_id`, `title`, `rrule`/campos de recorrência (dia da semana, horário), `next_at`.
- No painel, seção **"Agenda"** para criar/editar reuniões recorrentes usando salas existentes (o `room_slug` já é o link fixo).
- Opcional: lembrete via Slack usando a integração existente (cron `pg_cron` chamando um endpoint público).

## Fase 4 — Relatórios de engajamento por equipe/período
- Agregar dados de `meeting_records` (Fase 1): nº de reuniões, duração total, sentimento médio, tópicos recorrentes.
- Nova seção **"Relatórios"** no painel com filtro por equipe e intervalo de datas, exibindo gráficos/resumos.

## Fase 5 — Ações e responsáveis da ata viram tarefas
- Nova tabela `action_items`: `meeting_id`, `team_id`, `description`, `assignee_member_id`, `due_date`, `status`.
- Server function que extrai as ações da ata (a ata já gera a tabela "Ações e Responsáveis") e cria tarefas atribuídas aos membros.
- Seção **"Tarefas"** por equipe com status (pendente/feita).

## Fase 6 — Branding por equipe (planos superiores)
- Colunas em `teams`: `logo_url`, `brand_color`.
- Upload de logo (storage) e aplicação do nome/logo/cor na tela da sala.
- Liberado apenas para planos `negocios`/`empresarial` (checar `PLANS` em `src/lib/plans.ts`).

## Detalhes técnicos
- Todas as novas tabelas em `public` seguem o padrão: `GRANT` para `authenticated`/`service_role`, RLS habilitada, políticas por dono/equipe (`owner_id = auth.uid()` ou membro da equipe via função `security definer`).
- Leituras/escritas do app via cliente Supabase autenticado (RLS aplicada); processamento de IA continua nas server functions existentes.
- Gates de recurso (Fases 3, 5, 6) leem `src/lib/plans.ts` como fonte única da verdade.
- Cron da Fase 3 usa `pg_cron` + rota `/api/public/*` (sem edge functions).

## Ordem sugerida de entrega
Fase 1 → 2 → 4 → 5 → 3 → 6. As fases 1 e 2 destravam as demais; começo pela Fase 1 assim que aprovar.

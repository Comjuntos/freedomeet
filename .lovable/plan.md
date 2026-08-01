## Objetivo
Conectar a ata gerada por IA ao Kanban de equipes: extrair automaticamente os itens de ação da reunião e criá-los como cartões atribuídos aos responsáveis. Depois, evoluir o Kanban com melhorias de gestão.

## Etapa 1 — Extrair ações da ata para o Kanban (foco agora)
- Nova server function `extractActions` (`src/lib/actions.functions.ts`): recebe a transcrição/ata + lista de membros da equipe e retorna JSON estruturado `[{ title, assignee, dueDate }]` usando o Lovable AI Gateway.
- Na sala (`room.$roomId.tsx`), após gerar a ata, exibir um botão "Enviar ações para o Kanban" com seletor de equipe.
- Ao confirmar, inserir os itens em `team_activities` (status `todo`), casando `assignee` com `team_members` da equipe por nome e preenchendo `due_date`.
- Feedback via toast com quantos cartões foram criados.

## Etapa 2 — Melhorar o Kanban no painel
- Arrastar e soltar cartões entre colunas (hoje só há botão "→").
- Editar título/responsável/prazo de um cartão existente.
- Destaque visual de atrasados e badge de responsável com avatar.

## Etapa 3 — Visão do gestor
- Painel resumo por pessoa: tarefas abertas, concluídas e atrasadas.
- Filtro por equipe já existe; adicionar contagem consolidada e exportação CSV.

## Detalhes técnicos
- `extractActions` segue o padrão das outras functions (`createServerFn`, `LOVABLE_API_KEY`, `response_format: json_object`, modelo `openai/gpt-5.5`).
- Inserção no Kanban usa o client Supabase autenticado no navegador (RLS já aplica por `owner_id`).
- Casamento de responsável: normaliza acentos/caixa e compara com `full_name` dos membros da equipe; sem correspondência fica sem responsável.
- Nenhuma mudança de schema é necessária — `team_activities` já tem `title`, `member_id`, `due_date`, `status`.

## Verificação
- Typecheck/build limpos.
- Testar na sala: gerar ata, extrair ações, confirmar cartões aparecendo no Kanban da equipe escolhida.

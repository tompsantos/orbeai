# workspace access foundation progress

Branch: feature/workspace-access-foundation

## checklist

- [x] 5.0 preparar branch e plano
- [x] 5.1 criar matriz de roles/permissões
- [x] 5.2 criar dependency de permissão no backend
- [x] 5.3 aplicar permissões em rotas sensíveis
- [x] 5.4 criar endpoints de membros do workspace
- [ ] 5.5 criar tela/admin de membros
- [ ] 5.6 permitir alteração de role/status
- [ ] 5.7 proteger ações destrutivas
- [ ] 5.8 testes de isolamento e autorização
- [ ] 5.9 documentação e release interna

## atualização: preparação

A etapa 5.0 iniciou a workspace access foundation.

Objetivo da fase:

- Evoluir autenticação para autorização por workspace.
- Definir roles e permissões explícitas.
- Aplicar controle de acesso no backend.
- Exibir membros e ações permitidas no frontend.
- Manter isolamento por workspace.

Arquivos criados:

- docs/workspace-access-foundation-plan.md
- docs/workspace-access-foundation-progress.md


---

## atualização: matriz de roles e permissões

A etapa 5.1 criou a matriz base de autorização da orbeAI.

Arquivos criados:

- backend/app/core/permissions.py
- backend/tests/test_permissions_matrix.py

Roles definidos:

- owner
- admin
- member
- viewer

Permissões definidas:

- workspace
- workspace settings
- members
- projects
- chats
- chat send
- artifacts
- memories
- audit
- feature flags
- model runs
- model providers

Comportamento definido:

- owner possui todas as permissões conhecidas.
- admin possui permissões administrativas operacionais, mas não altera roles.
- member pode operar dentro do workspace, mas não administra membros, auditoria ou feature flags.
- viewer é leitura.
- roles desconhecidos não recebem permissões.
- permissões desconhecidas são negadas até para owner.

Observação:

- Esta etapa ainda não aplica permissões nas rotas.
- A aplicação nas rotas começa na etapa 5.2 com dependency reutilizável.


---

## atualização: dependency de permissões

A etapa 5.2 criou a camada reutilizável de autorização por permissão no backend.

Arquivos criados:

- backend/app/dependencies/permissions.py
- backend/tests/test_permissions_dependency.py

Funções criadas:

- require_known_permission
- ensure_workspace_permission
- require_permission
- get_current_permissions

Comportamento definido:

- Permissões desconhecidas falham cedo com ValueError.
- Usuários sem permissão recebem HTTP 403.
- O erro 403 retorna código permission_denied.
- A resposta de erro inclui a permissão exigida.
- require_permission cria uma dependency reutilizável para rotas FastAPI.
- get_current_permissions permite listar as permissões do usuário atual.

Observação:

- Esta etapa ainda não aplica permissões nas rotas reais.
- A aplicação nas rotas começa na etapa 5.3.


---

## atualização: permissões aplicadas nas rotas sensíveis

A etapa 5.3 aplicou a dependency require_permission nas rotas sensíveis do backend.

Arquivos alterados:

- backend/app/routers/projects.py
- backend/app/routers/workspace.py
- backend/app/routers/chat_send.py
- backend/app/routers/artifacts.py
- backend/app/routers/memories.py
- backend/app/routers/audit.py
- backend/app/routers/feature_flags.py
- backend/app/routers/model_runs.py
- backend/app/routers/model_providers.py

Arquivo de teste criado:

- backend/tests/test_route_permissions_api.py

Comportamento implementado:

- Projects exigem projects.read, projects.create ou projects.update.
- Workspace exige workspace.read ou workspace.update.
- Workspace settings exige workspace.settings.update.
- Chat send exige chat.send.
- Artifacts exigem artifacts.read, artifacts.create, artifacts.update ou artifacts.delete.
- Memories exigem memories.read, memories.create, memories.update ou memories.delete.
- Audit logs exigem audit.read.
- Feature flags exigem feature_flags.read ou feature_flags.update.
- Model runs exigem model_runs.read.
- Model providers exige model_providers.read.

Melhoria de isolamento:

- Artifacts passaram a usar current_workspace em vez de workspace padrão.
- Memories passaram a usar current_workspace em vez de workspace padrão.
- Audit logs passaram a filtrar por current_workspace.
- Feature flags passaram a usar current_workspace.
- Model runs passaram a filtrar por current_workspace.
- Model providers passaram a calcular latência e feature flag por current_workspace.

Validação manual:

- A rota /v1/feature-flags retornou 200 para usuário com membership owner.
- A validação local exigiu corrigir a role da membership de desenvolvimento para owner.

Resultado esperado:

- Rotas protegidas continuam funcionando para owner.
- Roles sem permissão recebem 403 com code permission_denied.
- Recursos não vazam entre workspaces.


---

## atualização: endpoints de membros do workspace

A etapa 5.4 criou endpoints de leitura para membros do workspace.

Arquivos criados:

- backend/app/schemas/workspace_members.py
- backend/tests/test_workspace_members_api.py

Arquivo alterado:

- backend/app/routers/workspace.py

Endpoints criados:

- GET /v1/workspace/members/me/access
- GET /v1/workspace/members
- GET /v1/workspace/members/{member_id}

Comportamento implementado:

- O usuário atual consegue consultar sua própria role, status e permissões.
- Usuários com members.read conseguem listar membros do workspace.
- Usuários com members.read conseguem abrir detalhe de membro.
- Listagem e detalhe são escopados ao current_workspace.
- Usuários sem members.read recebem 403.
- Membros de outro workspace retornam 404.

Observação:

- Esta etapa é apenas leitura.
- Alteração de role/status fica para a etapa 5.6.


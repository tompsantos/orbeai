# workspace access foundation progress

Branch: feature/workspace-access-foundation

## checklist

- [x] 5.0 preparar branch e plano
- [x] 5.1 criar matriz de roles/permissões
- [x] 5.2 criar dependency de permissão no backend
- [ ] 5.3 aplicar permissões em rotas sensíveis
- [ ] 5.4 criar endpoints de membros do workspace
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


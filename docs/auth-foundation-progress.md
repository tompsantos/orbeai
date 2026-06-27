# orbeAI - progresso da fase 4: auth foundation

Branch: feature/auth-foundation  
Base: main após merge da backend foundation  
Início: 2026-06-27

## status atual

    [~] fase 4 iniciada

## objetivo

Criar a fundação real de autenticação, usuários, sessões e memberships da orbeAI.

## fases planejadas

- [x] 4.0 preparar branch e plano
- [x] 4.1 criar modelos de User, WorkspaceMember e AuthSession
- [x] 4.2 criar migration real
- [x] 4.3 criar schemas e services de auth
- [x] 4.4 criar endpoints register/login/me/logout
- [x] 4.5 proteger rotas principais
- [x] 4.6 migrar runtime para current_user/current_workspace
- [ ] 4.7 integrar frontend com sessão real
- [ ] 4.8 criar telas de login/cadastro
- [ ] 4.9 testar e revisar
- [ ] 4.10 preparar release interna

## decisões iniciais

- Usar Postgres real.
- Não usar SQLite.
- Usar token opaco com hash salvo no banco.
- Manter JWT para avaliação posterior, não como primeira escolha.
- Health/status continuam públicos.
- Workspace padrão segue temporário até current_workspace ficar pronto.


---

## atualização: modelos de auth

A etapa 4.1 criou os modelos SQLAlchemy da fundação de autenticação.

Modelos adicionados:

- User
- WorkspaceMember
- AuthSession

Tabelas planejadas:

- users
- workspace_members
- auth_sessions

Decisões aplicadas:

- User usa email único.
- Senha será armazenada apenas como password_hash.
- WorkspaceMember conecta users a workspaces com role e status.
- AuthSession usa token_hash, não token em texto puro.
- AuthSession possui expiração e revogação.
- A migration real fica para a etapa 4.2.


---

## atualização: migration real de auth

A etapa 4.2 criou e aplicou a migration real da fundação de autenticação.

Migration adicionada:

- 20260627_0004_auth_foundation.py

Tabelas criadas:

- users
- workspace_members
- auth_sessions

Constraints principais:

- users.email único.
- workspace_members com par workspace_id + user_id único.
- auth_sessions.token_hash único.
- workspace_members referencia workspaces e users.
- auth_sessions referencia users.

Status:

- Migration aplicada em Postgres real.
- Alembic head atualizado para 20260627_0004.
- Testes de contrato dos modelos e da migration adicionados.


---

## atualização: schemas e services de auth

A etapa 4.3 criou a camada interna de autenticação.

Arquivos adicionados:

- app/core/security.py
- app/schemas/auth.py
- app/services/auth.py

Recursos implementados:

- Normalização de email.
- Hash de senha com PBKDF2-SHA256.
- Verificação segura de senha.
- Criação de token opaco.
- Hash de token para persistência segura.
- Registro interno de usuário.
- Criação automática de membership no workspace padrão.
- Autenticação por email e senha.
- Criação de sessão.
- Validação de sessão ativa.
- Revogação de sessão.

Decisões mantidas:

- Token real não é salvo no banco.
- Apenas token_hash é persistido.
- Primeiro usuário registrado vira superuser e owner do workspace padrão.
- Endpoints públicos ficam para a etapa 4.4.


---

## atualização: endpoints de auth

A etapa 4.4 criou os primeiros endpoints reais de autenticação.

Endpoints adicionados:

- POST /v1/auth/register
- POST /v1/auth/login
- GET /v1/auth/me
- GET /v1/auth/session
- POST /v1/auth/logout

Arquivos adicionados:

- app/dependencies/auth.py
- app/routers/auth.py

Comportamento validado:

- Registro cria usuário e sessão.
- Login retorna token opaco.
- /me exige token Bearer válido.
- /session exige token Bearer válido.
- Logout revoga sessão.
- Token revogado deixa de autenticar.
- Senha e password_hash não aparecem nas respostas.


---

## atualização: proteção de rotas principais

A etapa 4.5 passou a exigir autenticação nas rotas principais da API.

Rotas públicas mantidas:

- GET /health
- GET /v1/status
- POST /v1/auth/register
- POST /v1/auth/login

Rotas protegidas:

- projects
- workspace
- artifacts
- memories
- chats
- messages
- chat/send
- model runs
- audit logs
- feature flags
- model providers
- orbeRouter

Estratégia de testes:

- Testes antigos usam override temporário de autenticação no conftest.
- Testes de auth real continuam usando Bearer token real.
- Novo teste valida que rotas principais rejeitam request sem token.
- Novo teste valida que rotas principais aceitam token válido.

Observação:

- Nesta etapa, as rotas exigem autenticação, mas ainda usam o workspace padrão internamente.
- A migração real para current_user/current_workspace fica para a etapa 4.6.


---

## atualização: current user e current workspace

A etapa 4.6 iniciou a migração da API para usar o usuário e o workspace autenticados.

Arquivos adicionados:

- app/dependencies/workspace.py

Rotas migradas:

- GET /v1/workspace
- PATCH /v1/workspace
- PATCH /v1/workspace/settings
- CRUD de /v1/projects
- POST /v1/chat/send

Comportamento validado:

- Workspace é resolvido pela membership ativa do usuário autenticado.
- Projects são criados dentro do current_workspace.
- Projects de outro workspace não ficam visíveis pelo endpoint de project.
- Chat runtime cria/reusa chat dentro do current_workspace.
- Mensagem do usuário recebe metadata de auth_user_id e auth_workspace_id.
- Testes antigos seguem com override temporário.
- Testes novos usam auth real com token Bearer.

Observação:

- A migração completa de todos os recursos para escopo por workspace segue nas próximas etapas.
- Nesta etapa, o foco foi workspace, projects e chat runtime.


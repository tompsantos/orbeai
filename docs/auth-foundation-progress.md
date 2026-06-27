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
- [ ] 4.2 criar migration real
- [ ] 4.3 criar schemas e services de auth
- [ ] 4.4 criar endpoints register/login/me/logout
- [ ] 4.5 proteger rotas principais
- [ ] 4.6 migrar runtime para current_user/current_workspace
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


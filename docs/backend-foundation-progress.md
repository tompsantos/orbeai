# orbeAI — progresso da fase 1: fundação do backend

> branch: `feature/backend-foundation`  
> início: 2026-06-27  
> objetivo: criar a base real da API da orbeAI com FastAPI, Postgres, Docker e healthcheck.

## status atual

```text
[~] fase 1 em andamento
```

## já concluído nesta branch

- [x] `main` recebeu o fast-forward da branch `refinar-ui-orbeai`.
- [x] Branch `feature/backend-foundation` criada a partir da `main` atualizada.
- [x] Pasta `backend/` criada.
- [x] Projeto Python configurado em `backend/pyproject.toml`.
- [x] App FastAPI inicial criado em `backend/app/main.py`.
- [x] Configuração central criada em `backend/app/core/config.py`.
- [x] Logging básico estruturável criado em `backend/app/core/logging.py`.
- [x] Endpoint `GET /health` criado.
- [x] Endpoint `GET /v1/status` criado.
- [x] CORS configurado para desenvolvimento local.
- [x] SQLAlchemy preparado.
- [x] Alembic preparado.
- [x] Dockerfile do backend criado.
- [x] `docker-compose.dev.yml` criado com API + Postgres.
- [x] `.env.example` atualizado com variáveis do backend.
- [x] Testes básicos de healthcheck criados.
- [x] README do backend criado.

## pendente para fechar a fase 1

- [ ] Rodar o backend no Codespaces.
- [ ] Validar `GET /health` via terminal.
- [ ] Validar `GET /v1/status` via terminal.
- [ ] Rodar testes Python.
- [ ] Rodar Docker Compose.
- [ ] Criar primeira migration real.
- [ ] Atualizar checklist principal marcando fase 1 como parcialmente concluída.

## comandos de teste local

### modo Python direto

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Em outro terminal:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/v1/status
```

### modo Docker Compose

Na raiz do repositório:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Teste:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/v1/status
```

## próximo passo técnico

Validar esta fundação no Codespaces. Depois disso, avançar para modelos reais do banco:

1. `workspaces`
2. `users`
3. `projects`
4. `chats`
5. `messages`
6. `artifacts`
7. `memories`
8. `audit_logs`
9. `model_runs`
10. `api_keys`


---

## atualização: migration inicial

Status atual da fase 1:

- [x] API /health validada localmente
- [x] API /v1/status validada localmente
- [x] modelos iniciais registrados no SQLAlchemy
- [x] testes Python passando
- [~] migration inicial criada
- [ ] migration validada em SQL offline
- [x] migration aplicada em Postgres real

Tabelas cobertas pela primeira migration:

- workspaces
- projects
- chats
- messages
- artifacts
- artifact_versions
- memories
- model_providers
- model_runs
- audit_logs
- integration_clients

Observação técnica:

- users, login, sessões e chaves reais de API ficam para a fase 3, autenticação e segurança.
- A fase atual prioriza persistência de conversas, projetos, artifacts, memória, logs de modelo, auditoria e clientes de integração.
- A migration foi escrita manualmente para não depender de banco local no Codespaces.
- A validação imediata será feita com alembic upgrade head --sql, que gera o SQL sem conectar no Postgres.
- A aplicação real da migration será testada em Postgres via Docker/Audaks.

Próximo passo depois da validação:

- criar endpoints reais de projects, chats e messages;
- manter provider mock por enquanto;
- só depois plugar modelo externo real.



---

## validação em Postgres real

A migration inicial foi aplicada com sucesso em um banco Postgres rodando via Docker no Codespaces.

Resultado validado:

- API /health respondeu com sucesso.
- API /v1/status respondeu com sucesso.
- Alembic executou upgrade head usando DATABASE_URL apontando para Postgres.
- Revision aplicada: 20260627_0001.
- Ambiente usado para validação: Docker Compose local do projeto.
- Objetivo: manter o mesmo caminho técnico previsto para Audaks, sem adaptação para SQLite.

Próximo passo técnico:

- criar endpoints reais para projects, chats e messages;
- persistir dados no Postgres;
- manter provider de IA em modo mock até o fluxo de dados estar estável;
- depois conectar o orbeRouter aos provedores reais.

---

## atualização: endpoints de projects

A fase 2.1 criou os primeiros endpoints reais de dados da orbeAI.

Status validado:

- POST /v1/projects cria projeto no Postgres.
- GET /v1/projects lista projetos salvos.
- GET /v1/projects/{project_id} busca projeto por id.
- PATCH /v1/projects/{project_id} atualiza projeto existente.
- Testes passaram usando DATABASE_URL apontando para Postgres real via Docker.
- Commit aplicado: 8007e07 add projects api endpoints.

Observação técnica:

- O workspace padrão orbeone é criado automaticamente enquanto a autenticação real ainda não existe.
- Esse bootstrap é temporário até a fase de auth/workspaces.
- O backend segue usando Postgres desde o início, sem SQLite.

---

## atualização: endpoints de chats

A fase 2.2 criou os endpoints reais de conversas da orbeAI.

Status validado:

- POST /v1/chats cria conversa no Postgres.
- GET /v1/chats lista conversas salvas.
- GET /v1/chats/{chat_id} busca conversa por id.
- PATCH /v1/chats/{chat_id} atualiza conversa existente.
- GET /v1/chats aceita filtro opcional por project_id.
- Conversas podem ser vinculadas a um projeto.
- Conversas usam o workspace padrão orbeone enquanto a autenticação real ainda não existe.
- Testes passaram usando DATABASE_URL apontando para Postgres real via Docker.
- Curl validou criação e listagem de conversa real ligada ao projeto orbeAI Core.
- Commit aplicado: 319038b add chats api endpoints.

Observação técnica:

- A lógica de criação do workspace padrão foi movida para app/services/bootstrap.py.
- O router de projects passou a reutilizar esse serviço.
- O backend segue usando Postgres desde o início, sem SQLite.
- A autenticação real e separação de workspaces por usuário ficam para uma fase posterior.

Próximo passo técnico:

- criar endpoints reais de messages;
- permitir criar mensagem ligada a chat;
- listar mensagens por chat;
- preparar base para resposta mock da orbeAI;
- depois ligar o fluxo chat -> message -> model_run.

---

## atualização: endpoints de messages

A fase 2.3 criou os endpoints reais de mensagens da orbeAI.

Status validado:

- POST /v1/chats/{chat_id}/messages cria mensagem no Postgres.
- GET /v1/chats/{chat_id}/messages lista mensagens de uma conversa.
- GET /v1/messages/{message_id} busca mensagem por id.
- Mensagens ficam vinculadas a um chat real.
- Ao criar uma mensagem, o updated_at do chat é atualizado.
- Testes passaram usando DATABASE_URL apontando para Postgres real via Docker.
- Curl validou criação e listagem de mensagem real dentro da conversa Primeira conversa real da orbeAI.
- Commit aplicado: 40b8f90 add messages api endpoints.

Estado atual da fase 2:

- projects persistem em Postgres.
- chats persistem em Postgres.
- messages persistem em Postgres.
- O backend já consegue guardar a estrutura principal de conversa da orbeAI.

Próximo passo técnico:

- criar endpoint de envio inteligente: POST /v1/chat/send;
- salvar mensagem do usuário;
- gerar resposta mock da orbeAI;
- salvar mensagem assistant;
- registrar model_run básico;
- depois substituir o provider mock pelo orbeRouter real.


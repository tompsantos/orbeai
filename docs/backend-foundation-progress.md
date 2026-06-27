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

---

## atualização: chat send mock

A fase 2.4 criou o primeiro fluxo completo de conversa da orbeAI.

Status validado:

- POST /v1/chat/send recebe mensagem do usuário.
- O endpoint cria um chat novo ou reutiliza um chat existente.
- A mensagem do usuário é salva na tabela messages.
- O provider mock gera uma resposta de assistant.
- A resposta da assistant é salva na tabela messages.
- Um registro é criado na tabela model_runs.
- O retorno da API inclui chat_id, provider, model, model_run_id, user_message e assistant_message.
- Curl validou envio real usando a conversa Primeira conversa real da orbeAI.
- Commit aplicado: dd7b22c add chat send mock flow.

Estado atual:

- projects persistem em Postgres.
- chats persistem em Postgres.
- messages persistem em Postgres.
- model_runs já registra execuções do fluxo mock.
- O backend já consegue sustentar uma conversa ponta a ponta sem provider externo.

Observação técnica:

- O provider atual é orbe-mock.
- O modelo atual é orbe-mock-v0.
- O fluxo foi preparado para receber o orbeRouter real depois.
- Nenhuma adaptação para SQLite foi usada.
- A validação continua usando Postgres real via Docker.

Próximo passo técnico recomendado:

- conectar o frontend ao endpoint POST /v1/chat/send;
- manter fallback mock visual enquanto a API não estiver acessível;
- depois criar o orbeRouter real para escolher OpenAI, Gemini, Qwen, Groq ou provider local.

---

## atualização: frontend conectado ao backend

A fase 2.5 conectou a interface visual da orbeAI ao backend real.

Status validado:

- O frontend passou a usar VITE_MOCK_MODE=false.
- O frontend passou a usar VITE_API_BASE_URL=/api.
- O Vite passou a fazer proxy de /api para http://localhost:8000.
- O chat visual em /app/chat lista conversas reais vindas do Postgres.
- O botão Nova cria conversa real no backend.
- O envio de mensagem chama POST /v1/chat/send.
- A resposta mock da assistant volta do backend real.
- Ao recarregar a página, as conversas e mensagens continuam persistidas.
- O service layer mantém fallback para mock mode quando VITE_MOCK_MODE=true.

A fase 2.6 conectou projects ao backend real.

Status validado:

- projectService.list usa GET /v1/projects quando mock mode está desligado.
- projectService.get usa GET /v1/projects/{project_id}.
- projectService.create usa POST /v1/projects.
- projectService.update usa PATCH /v1/projects/{project_id}.
- Cockpit e tela de projetos passam a consumir projetos reais do Postgres.
- .env.local fica fora do commit e serve apenas para ambiente local.

Observação técnica:

- A solução usa proxy /api no Vite, igual ao padrão que depois será reproduzido no Nginx da Audaks.
- Nenhum endpoint foi adaptado para Codespaces.
- O backend continua preparado para Docker, Postgres e deploy em servidor real.

Próximo passo técnico:

- expor model_runs via API;
- permitir visualizar execuções de modelo por chat;
- preparar base para tela de uso, custos e observabilidade;
- depois conectar adminService/modelService ao backend real.


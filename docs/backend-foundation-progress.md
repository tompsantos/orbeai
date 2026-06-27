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

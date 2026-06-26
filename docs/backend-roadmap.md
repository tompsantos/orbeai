# orbeAI — Roadmap de Backend

## Fase 0 — Mock (atual)
- Service layer 100% mock, persistência em memória + localStorage.
- Providers de LLM em modo placeholder, exceto `MockProvider`.

## Fase 1 — Persistência
- Supabase/Postgres com schema em `docs/database-schema.sql`.
- Auth (Supabase Auth ou equivalente) e RLS por workspace.
- Migrar `projectService`, `chatService`, `memoryService`, `artifactService`.

## Fase 2 — LLM real
- Server functions (TanStack Start `createServerFn`) para chamar provedores.
- Chaves apenas em env server-side. Nada de `VITE_*` para chaves privadas.
- `orbeRouter` decide e o handler server-side executa.

## Fase 3 — Agentes e integrações
- Workers/queues para agentes de longa duração.
- OAuth para integrações (Google, GitHub, Slack, etc.).
- Webhooks em `src/routes/api/public/*`.

## Fase 4 — Enterprise
- SSO, audit logs imutáveis, retenção configurável, exportação de memória.
- Feature flags server-side, multi-region, observabilidade.

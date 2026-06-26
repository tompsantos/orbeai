## Rodada final orbeAI — plano de execução

Escopo enorme. Vou executar em ordem de prioridade declarada, em uma única rodada longa, sem quebrar nada do que já existe. Tudo continua em `VITE_MOCK_MODE=true`, sem chamadas reais a LLMs.

### Correções imediatas
- `package.json`: renomear para `orbeai`, adicionar `"typecheck": "tsc --noEmit"`.
- `README.md`: corrigir versão do Vite conforme `package.json` real, manter scripts coerentes.
- `AppShell` / chat: trocar `AvatarFallback "CA"` por `"OA"` (orbeOne Admin).

### Parte 1 — Service layer + persistência local
- `src/lib/storage/localStore.ts`: helper SSR-safe com prefixo `orbeai:`, seed a partir de `mockData`, `get/set/update/remove/resetDemoData`.
- `src/lib/api/client.ts`: `ApiClient` async, lê `VITE_MOCK_MODE` e `VITE_API_BASE_URL`, em mock delega a repositórios locais.
- `src/lib/api/endpoints.ts`: catálogo de rotas futuras.
- `src/lib/api/services/*`: um arquivo por domínio (`me`, `project`, `chat`, `artifact`, `memory`, `agent`, `integration`, `model`, `research`, `admin`, `orbeOne`), cada um com CRUD/ações reais sobre o localStore.
- `src/lib/api/index.ts`: apenas reexporta services (preserva imports atuais via objeto `api`/services nominais).

### Parte 2 — Backend-ready
- `src/server/api/{types,llm,router,memory,artifacts,projects,audit}.ts`: stubs server-side documentados, sem expor chaves no client. Funções placeholder com TODO de integração.
- `src/lib/backend/{contracts.ts,mockBackend.ts,backendClient.ts}`: contratos compartilhados client/server, mock backend usado em mock mode, `backendClient` decide entre mock e (futuro) real.

### Parte 3 — orbeRouter v2
- `src/lib/ai/router/index.ts`: detectar `taskHints` por regex no prompt; retornar `provider, model, reason, fallbackChain, routingMode, estimatedLatencyMs, estimatedCostUsd, qualityTier, taskHints, debugInfo`. Mock continua único funcional.

### Parte 4 — Ações reais (estado local)
- Chat: nova conversa, persistência de mensagens, pin, salvar memória, virar artifact, regenerar, comparar modelos (modal), tudo via services.
- Projects: modal “novo projeto”, edição de status/memoryMode, vínculo com produto orbeOne.
- Artifacts: modal de criação, salvar=nova versão, export `.md/.txt`, transformar formato mock, melhorar com IA mock.
- Memory: filtros funcionais, edit/delete/approve/reject, campo `reason`.
- Integrations: conectar/reconectar/configurar com audit log.
- Models: provider padrão, routing mode, fallback chain persistidos; cards de custo/latência/qualidade; status seguro de API key.
- Admin: feature flags toggláveis, audit log dinâmico, usage events, tabelas de users/workspaces, filtros, security events, health cards.

### Parte 5 — Chat premium
- Painel direito contextual (projeto, modo, modelo, decisão do router, escopo de memória, anexos, ações sugeridas, produtos orbeOne relacionados).
- Composer redesenhado (estados de anexo, enviar/parar, helper text).
- Mensagens com markdown leve (headings, listas, quotes, code) via parser próprio mínimo (sem nova dep pesada — usar `react-markdown` se já presente, senão renderer próprio).
- Toolbar de ações elegante, loading premium.

### Partes 6-9 — Artifact Studio, Research Lab, Memory Center, Admin Enterprise
- Refino visual + funcionalidade real local conforme spec, sempre conectado aos services.

### Parte 10 — Docs
- `docs/database-schema.sql`: adicionar `workspace_id`, `created_by`, `updated_at`, `metadata jsonb`, `reason`, `pinned`, etc.
- `docs/backend-roadmap.md`: 6 fases (0→5).
- `docs/architecture.md`: refletir client/service/storage/backend contracts e mock mode.
- `.env.example`: refletir variáveis realmente usadas.

### Parte 11 — Qualidade
- Tipos fortes, componentização (`ChatContextPanel`, `CompareModal`, `NewProjectDialog`, `NewArtifactDialog`, `MemoryEditDialog`, `AdminTables`, etc.).
- SSR-safe (`typeof window` checks).
- Sem quebrar rotas existentes, dark mode preservado.
- TODOs claros onde não der para implementar.

### Estratégia de execução
Grandes batches paralelos:
1. Fundação: localStore, contracts, mockBackend, backendClient, ApiClient, endpoints, todos os services, router v2, server stubs, package.json, README, docs.
2. Componentes compartilhados novos (dialogs, painel de contexto, markdown renderer, compare modal, tabelas admin).
3. Rotas refinadas: chat, projects (list + $id), artifacts, research, memory, integrations, models, admin.
4. Verificação: build/typecheck e ajustes.

Resultado: orbeAI muito mais próxima de produto — front premium, persistência local real, arquitetura backend-ready limpa, docs coerentes.

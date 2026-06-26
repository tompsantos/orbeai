# orbeAI

**orbeAI** é o sistema operacional cognitivo central da **orbeOne** — uma plataforma premium de IA de propósito geral com projetos, memória controlável, chat multimodal, artifacts, modo pesquisa, agentes, roteamento de modelos e integração profunda com o ecossistema orbeOne.

> Estado atual: **protótipo navegável em mock mode**. Persistência local via `localStorage`, camada de serviços e contratos de backend prontos para conectar a um backend real.

## Stack

- TanStack Start v1 (SSR) + React 19
- Vite 8
- Tailwind CSS v4 + shadcn/ui
- TypeScript estrito
- TanStack Router (file-based em `src/routes/`)

## Rotas principais

- `/` — landing
- `/app` — cockpit
- `/app/chat` — chat multimodal
- `/app/projects` — projetos
- `/app/artifacts` — artifact studio
- `/app/research` — research lab
- `/app/agents` — agentes
- `/app/memory` — memory center
- `/app/integrations` — integrações
- `/app/models` — model router
- `/app/orbeone` — ecossistema orbeOne
- `/app/admin` — cockpit administrativo
- `/app/settings` — configurações

## Como rodar

```bash
bun install
bun dev
```

## Scripts

- `bun dev` — dev server
- `bun run build` — build de produção
- `bun run typecheck` — typecheck (`tsc --noEmit`)
- `bun run lint` — lint
- `bun run format` — prettier

## Variáveis de ambiente

Veja `.env.example`. As variáveis `VITE_*` são públicas. Chaves de provedores LLM (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) devem ser usadas **somente server-side** e nunca expostas em builds de client.

## Modo mock

O app roda hoje em `VITE_MOCK_MODE=true`. Dados iniciais vêm de `src/lib/mock/data.ts`, são plantados em `localStorage` (prefixo `orbeai:`) e gerenciados pela camada de serviços em `src/lib/api/services/`. Para limpar a base local: `resetDemoData()` em `src/lib/storage/localStore.ts`.

## Arquitetura

- `src/lib/storage/localStore.ts` — persistência client-side, SSR-safe.
- `src/lib/api/client.ts` + `endpoints.ts` — cliente de API agnóstico (mock/real).
- `src/lib/api/services/*` — um serviço por domínio (projects, chats, artifacts, memory, agents, integrations, models, research, admin, orbeOne, me).
- `src/lib/backend/{contracts,mockBackend,backendClient}.ts` — contratos client/server e mock backend isomórfico.
- `src/server/api/*` — stubs server-side para futura integração com LLM real, memória vetorial, auditoria.
- `src/lib/ai/router` — `orbeRouter` v2 com decisão explicável.

Veja `docs/architecture.md` e `docs/backend-roadmap.md`.

## Deploy SSR

O template alvo é Edge (Cloudflare Workers). Para Node SSR atrás de Nginx:

1. `bun run build` gera o bundle SSR.
2. Sirva com um runtime Node compatível e faça proxy reverso via Nginx.
3. Configure variáveis de ambiente server-side (chaves de LLM, DB).

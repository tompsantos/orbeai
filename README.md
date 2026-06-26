# orbeAI

**orbeAI** é o sistema operacional cognitivo central da **orbeOne** — uma plataforma premium de IA de propósito geral com projetos, memória controlável, chat multimodal, artifacts, modo pesquisa, agentes, roteamento de modelos e integração profunda com o ecossistema orbeOne.

> Versão atual: **protótipo / mock mode**. Totalmente navegável, com camada de serviços pronta para conectar a um backend real.

## Stack

- TanStack Start v1 (SSR) + React 19
- Vite 7
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
- `bun run typecheck` — typecheck
- `bun run lint` — lint

## Variáveis de ambiente

Veja `.env.example`. As variáveis `VITE_*` são públicas. Chaves de provedores LLM (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) devem ser usadas **somente server-side** e nunca expostas em builds de client.

## Modo mock

O app roda hoje em `VITE_MOCK_MODE=true`. Todos os dados vêm de `src/lib/mock/data.ts` e os providers de LLM, exceto `MockProvider`, estão em modo placeholder.

## Próximos passos (backend real)

Veja `docs/backend-roadmap.md` e o schema em `docs/database-schema.sql`.

## Deploy SSR

O template alvo é Edge (Cloudflare Workers). Para Node SSR atrás de Nginx:

1. `bun run build` gera o bundle SSR.
2. Sirva com um runtime Node compatível e faça proxy reverso via Nginx.
3. Configure variáveis de ambiente server-side (chaves de LLM, DB).

# orbeAI — Arquitetura

orbeAI é o sistema operacional cognitivo central da **orbeOne**. Esta versão é um protótipo premium, totalmente navegável, com camada de mock backend pronta para ser substituída por um backend real.

## Camadas

1. **UI (TanStack Start + React 19 + Tailwind 4 + shadcn/ui)**
   - Rotas em `src/routes/` (file-based).
   - Design system em `src/styles.css` e `src/components/design-system/`.
   - Layout principal: `src/components/layout/AppShell.tsx`.
2. **Domínio**
   - Tipos em `src/types/`.
   - Mock data em `src/lib/mock/data.ts` (substituível por API real).
3. **Service layer (repository-like)**
   - `src/lib/api/client.ts` — HTTP client genérico (mock + futuro REST).
   - `src/lib/api/endpoints.ts` — catálogo de endpoints.
   - `src/lib/api/services/*` — um service por domínio.
4. **AI layer**
   - `src/lib/ai/providers/` — adapters (OpenAI, Anthropic, Gemini, Qwen, Groq, Local, Mock).
   - `src/lib/ai/router/` — `orbeRouter` com decisão de provedor, fallback chain e metadados.

## Princípios

- **Mock-first, backend-ready**: cada service tem assinatura compatível com a futura API real.
- **Chaves nunca no client**: provedores reais só são chamados server-side.
- **Memória controlável**: usuário decide o que é lembrado, editado ou apagado.
- **Roteamento explicável**: cada decisão do `orbeRouter` é serializável e auditável.
- **Workspace isolation**: dados são escopados por workspace e por projeto.

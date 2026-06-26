import type { ChatMode, ModelKey, ProviderSlug, RoutingMode } from "@/types";
import { providersBySlug, type AIRequest, type AIResponse } from "@/lib/ai/providers";

export interface RouterDecision {
  provider: ProviderSlug;
  model: string;
  reason: string;
  fallbackChain: ProviderSlug[];
}

const MODE_TO_PROVIDER: Record<ChatMode, ProviderSlug> = {
  padrão: "mock",
  strategist: "anthropic",
  dev: "anthropic",
  research: "gemini",
  document: "openai",
  creative: "openai",
  ops: "groq",
  mentor: "anthropic",
  safe: "openai",
};

const MODEL_TO_PROVIDER: Record<Exclude<ModelKey, "auto">, ProviderSlug> = {
  gpt: "openai",
  claude: "anthropic",
  gemini: "gemini",
  qwen: "qwen",
  groq: "groq",
  local: "local",
};

export function resolveRoute(opts: {
  mode?: ChatMode;
  model?: ModelKey;
  routingMode?: RoutingMode;
}): RouterDecision {
  const { mode, model, routingMode } = opts;
  let provider: ProviderSlug = "mock";
  let reason = "Roteamento automático orbeRouter";

  if (model && model !== "auto") {
    provider = MODEL_TO_PROVIDER[model];
    reason = `Modelo selecionado manualmente (${model})`;
  } else if (routingMode === "menor custo") {
    provider = "groq";
    reason = "Política de menor custo";
  } else if (routingMode === "mais rápido") {
    provider = "groq";
    reason = "Política de menor latência";
  } else if (routingMode === "raciocínio profundo") {
    provider = "anthropic";
    reason = "Raciocínio profundo";
  } else if (mode) {
    provider = MODE_TO_PROVIDER[mode];
    reason = `Modo orbe ${mode} → provedor ideal`;
  }

  const fallbackChain: ProviderSlug[] = ["mock"];
  return { provider, model: providersBySlug[provider].slug, reason, fallbackChain };
}

export async function runWithFallback(decision: RouterDecision, req: AIRequest): Promise<AIResponse> {
  const order: ProviderSlug[] = [decision.provider, ...decision.fallbackChain];
  let lastError: unknown;
  for (const slug of order) {
    const p = providersBySlug[slug];
    if (!p.isConfigured()) { lastError = new Error(`${slug} não configurado`); continue; }
    try { return await p.complete(req); }
    catch (e) { lastError = e; continue; }
  }
  throw lastError ?? new Error("Nenhum provedor disponível");
}

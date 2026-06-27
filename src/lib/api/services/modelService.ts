import { apiClient } from "@/lib/api/client";
import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockProviders } from "@/lib/mock/data";
import type { ModelConfig, ModelProvider, ProviderSlug, RoutingMode } from "@/types";

const DEFAULT_CONFIG: ModelConfig = {
  defaultProvider: "mock",
  fallbackChain: ["mock"],
  routingMode: "automático",
};

interface BackendModelProvider {
  slug: string;
  name: string;
  status: string;
  models: string[];
  api_key_status: string;
  latency_ms: number | null;
  cost_per_k_tokens: number | null;
}

function toProviderSlug(value: string): ProviderSlug {
  if (value === "openai") return "openai";
  if (value === "anthropic") return "anthropic";
  if (value === "gemini") return "gemini";
  if (value === "qwen") return "qwen";
  if (value === "groq") return "groq";
  if (value === "local") return "local";
  return "mock";
}

function toStatus(value: string): ModelProvider["status"] {
  if (value === "online") return "online";
  if (value === "offline") return "offline";
  return "placeholder";
}

function toApiKeyStatus(value: string): ModelProvider["apiKeyStatus"] {
  if (value === "configurado") return "configurado";
  if (value === "ambiente") return "ambiente";
  return "não configurado";
}

function toModelProvider(dto: BackendModelProvider): ModelProvider {
  return {
    slug: toProviderSlug(dto.slug),
    name: dto.name,
    status: toStatus(dto.status),
    models: dto.models,
    apiKeyStatus: toApiKeyStatus(dto.api_key_status),
    latencyMs: dto.latency_ms ?? undefined,
    costPerKTokens: dto.cost_per_k_tokens ?? undefined,
  };
}

export const modelService = {
  async providers(): Promise<ModelProvider[]> {
    if (!apiClient.isMock) {
      const providers = await apiClient.request<BackendModelProvider[]>("/v1/model-providers");
      return providers.map(toModelProvider);
    }

    localStore.ensureSeeded();
    return localStore.get<ModelProvider[]>(STORAGE_KEYS.providers, mockProviders);
  },

  async getConfig(): Promise<ModelConfig> {
    return localStore.get<ModelConfig>(STORAGE_KEYS.modelConfig, DEFAULT_CONFIG);
  },

  async setDefaultProvider(slug: ProviderSlug) {
    const cfg = await this.getConfig();
    return localStore.set(STORAGE_KEYS.modelConfig, { ...cfg, defaultProvider: slug });
  },

  async setRoutingMode(mode: RoutingMode) {
    const cfg = await this.getConfig();
    return localStore.set(STORAGE_KEYS.modelConfig, { ...cfg, routingMode: mode });
  },

  async setFallbackChain(chain: ProviderSlug[]) {
    const cfg = await this.getConfig();
    return localStore.set(STORAGE_KEYS.modelConfig, { ...cfg, fallbackChain: chain });
  },
};

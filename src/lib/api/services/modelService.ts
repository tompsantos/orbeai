import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockProviders } from "@/lib/mock/data";
import type { ModelConfig, ModelProvider, ProviderSlug, RoutingMode } from "@/types";

const DEFAULT_CONFIG: ModelConfig = {
  defaultProvider: "mock",
  fallbackChain: ["mock"],
  routingMode: "automático",
};

export const modelService = {
  async providers(): Promise<ModelProvider[]> {
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

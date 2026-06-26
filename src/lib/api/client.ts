/**
 * orbeAI — ApiClient
 * Cliente HTTP agnóstico. Em mock mode (default), os services usam repositories locais
 * sobre localStore. Quando VITE_MOCK_MODE=false e VITE_API_BASE_URL existir, este
 * cliente passa a fazer fetch real (não implementado ainda — TODO Fase 1).
 */

export interface ApiClientConfig {
  baseUrl?: string;
  mockMode: boolean;
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const apiConfig: ApiClientConfig = {
  baseUrl: env.VITE_API_BASE_URL ?? "",
  mockMode: (env.VITE_MOCK_MODE ?? "true") !== "false",
};

export class ApiClient {
  constructor(public readonly config: ApiClientConfig = apiConfig) {}

  get isMock() { return this.config.mockMode; }

  async request<T>(_path: string, _init?: RequestInit): Promise<T> {
    if (this.config.mockMode) {
      throw new Error(
        "ApiClient.request() não deve ser chamado em mock mode — use os services locais."
      );
    }
    // TODO Fase 1: implementar fetch real com auth + tratamento de erros.
    throw new Error("Backend real ainda não conectado. Mantenha VITE_MOCK_MODE=true.");
  }
}

export const apiClient = new ApiClient();

import { apiClient } from "@/lib/api/client";
import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockAudit, mockFlags, mockUsage } from "@/lib/mock/data";
import type { AuditLog, FeatureFlag, ProviderSlug, UsageMetric } from "@/types";

interface BackendModelRun {
  id: string;
  workspace_id: string | null;
  chat_id: string | null;
  message_id: string | null;
  provider_name: string;
  model_name: string;
  task_type: string | null;
  status: string;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  router_reason: string | null;
  fallback_chain: unknown[] | null;
  error_message: string | null;
  created_at: string;
}

function toProviderSlug(value: string | null | undefined): ProviderSlug {
  if (value === "openai") return "openai";
  if (value === "anthropic") return "anthropic";
  if (value === "gemini") return "gemini";
  if (value === "qwen") return "qwen";
  if (value === "groq") return "groq";
  if (value === "local") return "local";

  return "mock";
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function modelRunsToUsage(modelRuns: BackendModelRun[]): UsageMetric[] {
  const byDate = new Map<string, UsageMetric>();

  for (const run of modelRuns) {
    const key = dateKey(run.created_at);
    const inputTokens = run.input_tokens ?? 0;
    const outputTokens = run.output_tokens ?? 0;
    const tokens = inputTokens + outputTokens;
    const costUsd = run.estimated_cost_usd ?? 0;

    const current = byDate.get(key) ?? {
      date: key,
      tokens: 0,
      requests: 0,
      costUsd: 0,
      provider: toProviderSlug(run.provider_name),
    };

    current.tokens += tokens;
    current.requests += 1;
    current.costUsd += costUsd;
    current.provider = toProviderSlug(run.provider_name);

    byDate.set(key, current);
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function modelRunsToAudit(modelRuns: BackendModelRun[]): AuditLog[] {
  return modelRuns.map((run) => ({
    id: run.id,
    actor: "orbeAI backend",
    action: run.task_type ?? "model.run",
    target: run.chat_id ?? run.message_id ?? run.id,
    at: run.created_at,
    level: run.status === "success" ? "info" : "error",
  }));
}

export const adminService = {
  async audit(filter?: { level?: AuditLog["level"]; q?: string }): Promise<AuditLog[]> {
    if (!apiClient.isMock) {
      const modelRuns = await apiClient.request<BackendModelRun[]>("/v1/model-runs?limit=100");
      let list = modelRunsToAudit(modelRuns);

      if (filter?.level) list = list.filter((l) => l.level === filter.level);

      if (filter?.q) {
        const q = filter.q.toLowerCase();
        list = list.filter((l) =>
          l.action.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q),
        );
      }

      return list.sort((a, b) => (a.at < b.at ? 1 : -1));
    }

    localStore.ensureSeeded();

    let list = localStore.get<AuditLog[]>(STORAGE_KEYS.auditLogs, mockAudit);

    if (filter?.level) list = list.filter((l) => l.level === filter.level);

    if (filter?.q) {
      const q = filter.q.toLowerCase();

      list = list.filter((l) =>
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q),
      );
    }

    return list.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  },

  async usage(): Promise<UsageMetric[]> {
    if (!apiClient.isMock) {
      const modelRuns = await apiClient.request<BackendModelRun[]>("/v1/model-runs?limit=200");
      return modelRunsToUsage(modelRuns);
    }

    return localStore.get<UsageMetric[]>(STORAGE_KEYS.usageEvents, mockUsage);
  },

  async flags(): Promise<FeatureFlag[]> {
    return localStore.get<FeatureFlag[]>(STORAGE_KEYS.featureFlags, mockFlags);
  },

  async toggleFlag(key: string): Promise<FeatureFlag | null> {
    const list = localStore.get<FeatureFlag[]>(STORAGE_KEYS.featureFlags, mockFlags);
    const idx = list.findIndex((f) => f.key === key);

    if (idx < 0) return null;

    list[idx] = { ...list[idx], enabled: !list[idx].enabled };
    localStore.set(STORAGE_KEYS.featureFlags, list);

    return list[idx];
  },
};

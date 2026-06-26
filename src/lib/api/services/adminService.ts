import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockAudit, mockFlags, mockUsage } from "@/lib/mock/data";
import type { AuditLog, FeatureFlag, UsageMetric } from "@/types";

export const adminService = {
  async audit(filter?: { level?: AuditLog["level"]; q?: string }): Promise<AuditLog[]> {
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

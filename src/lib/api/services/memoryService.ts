import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockMemory } from "@/lib/mock/data";
import { auditService } from "@/lib/api/services/auditInternal";
import type { MemoryItem } from "@/types";

export interface MemoryItemExt extends MemoryItem { reason?: string }

function all(): MemoryItemExt[] {
  localStore.ensureSeeded();
  return localStore.get<MemoryItemExt[]>(STORAGE_KEYS.memory, mockMemory as MemoryItemExt[]);
}
function save(list: MemoryItemExt[]) { localStore.set(STORAGE_KEYS.memory, list); }

export const memoryService = {
  async list(filter?: { scope?: MemoryItem["scope"]; status?: MemoryItem["status"]; projectId?: string; q?: string }) {
    let list = all();
    if (filter?.scope) list = list.filter((m) => m.scope === filter.scope);
    if (filter?.status) list = list.filter((m) => m.status === filter.status);
    if (filter?.projectId) list = list.filter((m) => m.projectId === filter.projectId);
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((m) => m.label.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
    }
    return list;
  },

  async create(input: Partial<MemoryItemExt> & { label: string; content: string }): Promise<MemoryItemExt> {
    const item: MemoryItemExt = {
      id: `mem_${Date.now()}`,
      scope: input.scope ?? "projeto",
      label: input.label,
      content: input.content,
      source: input.source ?? "manual",
      confidence: input.confidence ?? 0.8,
      lastUsed: new Date().toISOString(),
      status: input.status ?? "pendente",
      projectId: input.projectId,
      reason: input.reason,
    };
    save([item, ...all()]);
    auditService.log({ action: "memory.create", target: item.id });
    return item;
  },

  async update(id: string, patch: Partial<MemoryItemExt>): Promise<MemoryItemExt | null> {
    const list = all();
    const idx = list.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch };
    save(list);
    return list[idx];
  },

  async remove(id: string) {
    save(all().filter((m) => m.id !== id));
    auditService.log({ action: "memory.remove", target: id, level: "warn" });
  },

  async approve(id: string) { return this.update(id, { status: "ativa" }); },
  async reject(id: string) { return this.update(id, { status: "arquivada" }); },
};

import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockArtifacts } from "@/lib/mock/data";
import { auditService } from "@/lib/api/services/auditInternal";
import type { Artifact, ArtifactKind } from "@/types";

function all(): Artifact[] {
  localStore.ensureSeeded();
  return localStore.get<Artifact[]>(STORAGE_KEYS.artifacts, mockArtifacts);
}
function save(list: Artifact[]) { localStore.set(STORAGE_KEYS.artifacts, list); }

export const artifactService = {
  async list() { return all(); },
  async get(id: string) { return all().find((a) => a.id === id) ?? null; },

  async create(input: { title: string; kind: ArtifactKind; content?: string; projectId?: string }): Promise<Artifact> {
    const now = new Date().toISOString();
    const a: Artifact = {
      id: `a_${Date.now()}`,
      title: input.title,
      kind: input.kind,
      projectId: input.projectId,
      content: input.content ?? "",
      updatedAt: now,
      versions: [{ id: `v_${Date.now()}`, createdAt: now, note: "Versão inicial" }],
    };
    save([a, ...all()]);
    auditService.log({ action: "artifact.create", target: a.id });
    return a;
  },

  async saveVersion(id: string, content: string, note = "Edição"): Promise<Artifact | null> {
    const list = all();
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const now = new Date().toISOString();
    const updated: Artifact = {
      ...list[idx],
      content,
      updatedAt: now,
      versions: [...list[idx].versions, { id: `v_${Date.now()}`, createdAt: now, note }],
    };
    list[idx] = updated;
    save(list);
    auditService.log({ action: "artifact.version", target: id });
    return updated;
  },

  async update(id: string, patch: Partial<Artifact>): Promise<Artifact | null> {
    const list = all();
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    save(list);
    return list[idx];
  },

  async remove(id: string) {
    save(all().filter((a) => a.id !== id));
    auditService.log({ action: "artifact.remove", target: id, level: "warn" });
  },

  async exportText(id: string): Promise<{ filename: string; content: string } | null> {
    const a = await this.get(id);
    if (!a) return null;
    const ext = a.kind === "código" || a.kind === "json" ? "txt" : "md";
    return { filename: `${a.title.replace(/\s+/g, "_")}.${ext}`, content: a.content };
  },

  async enhanceMock(id: string): Promise<Artifact | null> {
    const a = await this.get(id);
    if (!a) return null;
    const improved = `${a.content}\n\n---\n\n_Refinado por orbeAI (mock) em ${new Date().toLocaleString("pt-BR")}_\n\n- Estrutura revisada\n- Tom premium aplicado\n- Pontos de ação destacados`;
    return this.saveVersion(id, improved, "Melhorado por orbeAI (mock)");
  },
};

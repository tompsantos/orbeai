import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockProjects } from "@/lib/mock/data";
import type { Project } from "@/types";

function all(): Project[] {
  localStore.ensureSeeded();
  return localStore.get<Project[]>(STORAGE_KEYS.projects, mockProjects);
}

function save(list: Project[]) { localStore.set(STORAGE_KEYS.projects, list); }

export const projectService = {
  async list() { return all(); },
  async get(id: string) { return all().find((p) => p.id === id) ?? null; },
  async create(input: Partial<Project> & { name: string }): Promise<Project> {
    const list = all();
    const project: Project = {
      id: `p_${Date.now()}`,
      name: input.name,
      description: input.description ?? "",
      status: input.status ?? "rascunho",
      product: input.product,
      memoryMode: input.memoryMode ?? "isolada",
      filesCount: 0,
      chatsCount: 0,
      artifactsCount: 0,
      agents: input.agents ?? [],
      updatedAt: new Date().toISOString(),
      brief: input.brief,
    };
    save([project, ...list]);
    return project;
  },
  async update(id: string, patch: Partial<Project>): Promise<Project | null> {
    const list = all();
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const next = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    list[idx] = next;
    save(list);
    return next;
  },
  async remove(id: string) {
    save(all().filter((p) => p.id !== id));
  },
};

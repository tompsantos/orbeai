import { mockAgents, mockArtifacts, mockAudit, mockChats, mockFlags, mockIntegrations,
  mockMemory, mockMessages, mockProjects, mockProviders, mockResearch, mockUsage,
  mockUser, mockWorkspace, orbeProducts } from "@/lib/mock/data";
import { resolveRoute, runWithFallback } from "@/lib/ai/router";
import type { ChatMode, Message, ModelKey } from "@/types";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const meService = {
  async getUser() { await delay(); return mockUser; },
  async getWorkspace() { await delay(); return mockWorkspace; },
};

export const projectService = {
  async list() { await delay(); return mockProjects; },
  async get(id: string) { await delay(); return mockProjects.find((p) => p.id === id) ?? null; },
};

export const chatService = {
  async list() { await delay(); return mockChats; },
  async messages(chatId: string): Promise<Message[]> { await delay(); return mockMessages[chatId] ?? []; },
  async send(chatId: string, content: string, opts: { mode?: ChatMode; model?: ModelKey } = {}) {
    const decision = resolveRoute({ mode: opts.mode, model: opts.model });
    const response = await runWithFallback(decision, { prompt: content, mode: opts.mode, model: opts.model });
    return { decision, response };
  },
};

export const artifactService = {
  async list() { await delay(); return mockArtifacts; },
  async get(id: string) { await delay(); return mockArtifacts.find((a) => a.id === id) ?? null; },
};

export const memoryService = {
  async list() { await delay(); return mockMemory; },
};

export const agentService = {
  async list() { await delay(); return mockAgents; },
};

export const integrationService = {
  async list() { await delay(); return mockIntegrations; },
};

export const modelService = {
  async providers() { await delay(); return mockProviders; },
};

export const researchService = {
  async list() { await delay(); return mockResearch; },
};

export const adminService = {
  async audit() { await delay(); return mockAudit; },
  async usage() { await delay(); return mockUsage; },
  async flags() { await delay(); return mockFlags; },
};

export const orbeOneService = {
  async products() { await delay(); return orbeProducts; },
};

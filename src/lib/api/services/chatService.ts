import { localStore, STORAGE_KEYS } from "@/lib/storage/localStore";
import { mockChats, mockMessages } from "@/lib/mock/data";
import { resolveRoute, runWithFallback } from "@/lib/ai/router";
import { auditService } from "@/lib/api/services/auditInternal";
import type { Chat, ChatMode, Message, ModelKey } from "@/types";

function allChats(): Chat[] {
  localStore.ensureSeeded();
  return localStore.get<Chat[]>(STORAGE_KEYS.chats, mockChats);
}
function saveChats(list: Chat[]) { localStore.set(STORAGE_KEYS.chats, list); }

function allMessages(): Record<string, Message[]> {
  localStore.ensureSeeded();
  return localStore.get<Record<string, Message[]>>(STORAGE_KEYS.messages, mockMessages);
}
function saveMessages(map: Record<string, Message[]>) { localStore.set(STORAGE_KEYS.messages, map); }

export const chatService = {
  async list() { return allChats(); },

  async get(id: string) { return allChats().find((c) => c.id === id) ?? null; },

  async messages(chatId: string): Promise<Message[]> {
    return allMessages()[chatId] ?? [];
  },

  async create(input: Partial<Chat> & { title?: string } = {}): Promise<Chat> {
    const chat: Chat = {
      id: `c_${Date.now()}`,
      title: input.title ?? "Nova conversa",
      projectId: input.projectId,
      mode: input.mode ?? "padrão",
      model: input.model ?? "auto",
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    saveChats([chat, ...allChats()]);
    const map = allMessages();
    map[chat.id] = [];
    saveMessages(map);
    auditService.log({ action: "chat.create", target: chat.id });
    return chat;
  },

  async appendMessage(chatId: string, msg: Message) {
    const map = allMessages();
    map[chatId] = [...(map[chatId] ?? []), msg];
    saveMessages(map);
    // bump chat updatedAt
    const chats = allChats();
    const idx = chats.findIndex((c) => c.id === chatId);
    if (idx >= 0) {
      chats[idx] = { ...chats[idx], updatedAt: new Date().toISOString() };
      saveChats(chats);
    }
  },

  async togglePin(chatId: string, messageId: string) {
    const map = allMessages();
    map[chatId] = (map[chatId] ?? []).map((m) =>
      m.id === messageId ? { ...m, pinned: !m.pinned } : m,
    );
    saveMessages(map);
  },

  async send(chatId: string, content: string, opts: { mode?: ChatMode; model?: ModelKey } = {}) {
    const decision = resolveRoute({ mode: opts.mode, model: opts.model, prompt: content });
    const response = await runWithFallback(decision, { prompt: content, mode: opts.mode, model: opts.model });
    auditService.log({ action: "chat.send", target: chatId, level: "info" });
    return { decision, response };
  },

  async compare(content: string, models: ModelKey[], mode?: ChatMode) {
    const results = await Promise.all(models.map(async (m) => {
      const decision = resolveRoute({ mode, model: m, prompt: content });
      try {
        const response = await runWithFallback(decision, { prompt: content, mode, model: m });
        return { model: m, decision, response, error: null as string | null };
      } catch (e) {
        return { model: m, decision, response: null, error: (e as Error).message };
      }
    }));
    return results;
  },
};

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/design-system/Primitives";
import { chatService, memoryService, artifactService, projectService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { OrbeMark } from "@/components/design-system/OrbeLogo";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { MessageToolbar } from "@/components/chat/MessageToolbar";
import { ChatContextPanel } from "@/components/chat/ChatContextPanel";
import { CompareModelsDialog } from "@/components/chat/CompareModelsDialog";
import type { Artifact, Attachment, Chat, ChatMode, MemoryItem, Message, ModelKey, Project } from "@/types";
import type { RouterDecision } from "@/lib/ai/router";
import {
  ArrowUp, Image as ImageIcon, Mic, Paperclip, Pin,
  Search, Sparkles, Square, X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "Chat · orbeAI" }] }),
  component: ChatPage,
});

const MODES: ChatMode[] = ["padrão", "strategist", "dev", "research", "document", "creative", "ops", "mentor", "safe"];
const MODELS: { key: ModelKey; label: string }[] = [
  { key: "auto", label: "automático (orbeRouter)" },
  { key: "gpt", label: "GPT" }, { key: "claude", label: "Claude" }, { key: "gemini", label: "Gemini" },
  { key: "qwen", label: "Qwen" }, { key: "groq", label: "Groq" }, { key: "local", label: "Local" },
];

function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [mode, setMode] = useState<ChatMode>("strategist");
  const [model, setModel] = useState<ModelKey>("auto");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [lastDecision, setLastDecision] = useState<RouterDecision | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [comparePrompt, setComparePrompt] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([chatService.list(), projectService.list(), artifactService.list(), memoryService.list()])
      .then(([cs, ps, as, ms]) => {
        setChats(cs);
        setProjects(ps);
        setArtifacts(as);
        setMemories(ms);
        if (cs.length) setActiveChatId(cs[0].id);
      });
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    void chatService.messages(activeChatId).then(setMessages);
    const chat = chats.find((c) => c.id === activeChatId);
    if (chat) { setMode(chat.mode); setModel(chat.model); }
  }, [activeChatId, chats]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const project = projects.find((p) => p.id === activeChat?.projectId);
  const chatArtifacts = artifacts.filter((a) => a.projectId === activeChat?.projectId);
  const chatMemories = memories.filter((m) => m.projectId === activeChat?.projectId || m.scope === "global");

  async function newChat() {
    const chat = await chatService.create({ title: "Nova conversa", mode, model });
    setChats(await chatService.list());
    setActiveChatId(chat.id);
    setMessages([]);
    setLastDecision(null);
  }

  function addAttachment() {
    const a: Attachment = { id: `att_${Date.now()}`, name: "exemplo-anexo.pdf", kind: "doc", sizeKb: 184 };
    setPendingAttachment(a);
    toast.success("Anexo mock adicionado");
  }

  async function runSend(text: string) {
    if (!activeChatId) return;
    setStreaming(true);
    try {
      const { response, decision } = await chatService.send(activeChatId, text, { mode, model });
      setLastDecision(decision);
      const asst: Message = {
        id: `a_${Date.now()}`, chatId: activeChatId, role: "assistant",
        content: response.content,
        createdAt: new Date().toISOString(), model, mode,
      };
      setMessages((m) => [...m, asst]);
      await chatService.appendMessage(activeChatId, asst);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Tente outro modelo.";
      toast.error("Provedor indisponível", { description: msg });
    } finally {
      setStreaming(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming || !activeChatId) return;
    const userMsg: Message = {
      id: `u_${Date.now()}`, chatId: activeChatId, role: "user", content: text,
      createdAt: new Date().toISOString(),
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
    };
    setMessages((m) => [...m, userMsg]);
    await chatService.appendMessage(activeChatId, userMsg);
    setInput(""); setPendingAttachment(null);
    await runSend(text);
  }

  async function onRegenerate(msg: Message) {
    if (streaming) return;
    const idx = messages.findIndex((m) => m.id === msg.id);
    const prevUser = [...messages].slice(0, idx).reverse().find((m) => m.role === "user");
    if (!prevUser) { toast.error("Sem prompt anterior para regenerar"); return; }
    await runSend(prevUser.content);
    toast.success("Resposta regenerada");
  }

  async function onMemory(msg: Message) {
    await memoryService.create({
      label: msg.content.slice(0, 60).replace(/\n/g, " ").trim() + (msg.content.length > 60 ? "…" : ""),
      content: msg.content,
      scope: project ? "projeto" : "global",
      source: "chat",
      status: "pendente",
      projectId: project?.id,
      reason: "Salvo a partir de resposta do chat",
    });
    setMemories(await memoryService.list());
    toast.success("Memória pendente criada", { description: "Revise em /app/memory" });
  }

  async function onArtifact(msg: Message) {
    const a = await artifactService.create({
      title: msg.content.split("\n").find((l) => l.trim().length) ?? "Artifact do chat",
      kind: "documento",
      content: msg.content,
      projectId: project?.id,
    });
    setArtifacts(await artifactService.list());
    toast.success("Artifact criado", { description: a.title });
  }

  function onCompare(msg: Message) {
    const idx = messages.findIndex((m) => m.id === msg.id);
    const prevUser = [...messages].slice(0, idx).reverse().find((m) => m.role === "user");
    setComparePrompt(prevUser?.content ?? msg.content);
    setCompareOpen(true);
  }

  async function onPin(msg: Message) {
    await chatService.togglePin(activeChatId, msg.id);
    setMessages(await chatService.messages(activeChatId));
  }

  const filteredChats = chats.filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-4 min-h-[620px] md:h-[calc(100vh-8rem)]">
        {/* Conversation list */}
        <aside className="orbe-card p-3 hidden md:flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="text-sm font-semibold">Conversas</div>
            <Button size="sm" variant="ghost" onClick={newChat}><Sparkles className="size-3.5 mr-1" /> Nova</Button>
          </div>
          <div className="relative px-2 mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…"
              className="w-full bg-muted/40 rounded-md pl-7 pr-2 py-1.5 text-sm outline-none focus:orbe-ring" />
          </div>
          <ScrollArea className="flex-1 -mx-1 px-1">
            <ul className="space-y-1">
              {filteredChats.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setActiveChatId(c.id)}
                    className={cn("w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent/60 transition-colors",
                      activeChatId === c.id && "bg-accent/70 orbe-glow")}>
                    <div className="flex items-center gap-2">
                      {c.pinned && <Pin className="size-3 text-[var(--orbe-blue)]" />}
                      <span className="truncate">{c.title}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">orbe {c.mode}</div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>

        {/* Conversation area */}
        <section className="orbe-card flex flex-col min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <OrbeMark size={22} />
            <div className="text-sm font-medium truncate max-w-[240px] md:max-w-none">{activeChat?.title ?? "Selecione uma conversa"}</div>
            <Pill tone="blue">orbe {mode}</Pill>
            {project && (
              <Link to="/app/projects/$id" params={{ id: project.id }}>
                <Pill tone="muted">{project.name}</Pill>
              </Link>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select value={mode} onValueChange={(v) => setMode(v as ChatMode)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{MODES.map((m) => <SelectItem key={m} value={m}>orbe {m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={model} onValueChange={(v) => setModel(v as ModelKey)}>
                <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{MODELS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-20">
                <OrbeMark size={32} className="mx-auto" />
                <p className="mt-3">Comece a conversa. A orbeAI usa o modo selecionado e roteia para o melhor modelo.</p>
              </div>
            )}
            {messages.map((m) => (
              <Bubble key={m.id} message={m}
                onCopy={() => { navigator.clipboard.writeText(m.content); toast.success("Copiado"); }}
                onRegenerate={() => onRegenerate(m)}
                onMemory={() => onMemory(m)}
                onArtifact={() => onArtifact(m)}
                onCompare={() => onCompare(m)}
                onPin={() => onPin(m)}
                disabled={streaming}
              />
            ))}
            {streaming && (
              <div className="flex items-start gap-3 animate-orbe-fade">
                <OrbeMark size={28} className="mt-1" />
                <div className="orbe-glass rounded-2xl px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--orbe-blue)] animate-orbe-pulse" />
                  <span>orbeAI está pensando…</span>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t p-3 md:p-4">
            {pendingAttachment && (
              <div className="mb-2 inline-flex items-center gap-2 text-xs bg-muted/40 rounded-full px-3 py-1.5">
                <Paperclip className="size-3" /> {pendingAttachment.name}
                <button onClick={() => setPendingAttachment(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              </div>
            )}
            <div className="orbe-glass rounded-2xl p-2 flex items-end gap-2">
              <Button variant="ghost" size="icon" title="Anexar" onClick={addAttachment}><Paperclip className="size-4" /></Button>
              <Button variant="ghost" size="icon" title="Imagem" onClick={() => toast("Multimodal disponível ao plugar provider real")}><ImageIcon className="size-4" /></Button>
              <Button variant="ghost" size="icon" title="Voz" onClick={() => toast("Voz disponível ao plugar provider real")}><Mic className="size-4" /></Button>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Converse com a orbeAI…"
                className="flex-1 border-0 bg-transparent resize-none min-h-[44px] max-h-40 focus-visible:ring-0 focus-visible:ring-offset-0" />
              {streaming ? (
                <Button size="icon" variant="outline" onClick={() => setStreaming(false)} title="Parar"><Square className="size-4" /></Button>
              ) : (
                <Button size="icon" onClick={send} disabled={!input.trim() || !activeChatId} title="Enviar"><ArrowUp className="size-4" /></Button>
              )}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground px-2">
              Enter envia · Shift+Enter quebra linha · respostas geradas pelo provedor mock até conectar APIs reais
            </div>
          </div>
        </section>
      </div>

      {/* Context cards below chat */}
      <section className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">contexto da conversa</div>
            <div className="text-sm text-muted-foreground">decisão do router, memórias, artifacts e ações relacionadas ficam aqui, sem apertar o chat.</div>
          </div>
        </div>
        <ChatContextPanel chat={activeChat} decision={lastDecision}
          projectName={project?.name} projectId={project?.id}
          artifacts={chatArtifacts} memories={chatMemories}
          memoryScope={project?.memoryMode ?? "global"}
          layout="grid" />
      </section>

      <CompareModelsDialog open={compareOpen} onOpenChange={setCompareOpen}
        prompt={comparePrompt} models={["auto", "claude", "gpt", "gemini"]} />
    </div>
  );
}

function Bubble({
  message, onCopy, onRegenerate, onMemory, onArtifact, onCompare, onPin, disabled,
}: {
  message: Message;
  onCopy: () => void; onRegenerate: () => void; onMemory: () => void;
  onArtifact: () => void; onCompare: () => void; onPin: () => void;
  disabled?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex items-start gap-3 animate-orbe-fade", isUser && "justify-end")}>
      {!isUser && <OrbeMark size={28} className="mt-1" />}
      <div className={cn("max-w-[78%]", isUser && "order-2")}>
        {!isUser && (message.model || message.mode) && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex flex-wrap gap-1.5">
            {message.model && <span>{message.model}</span>}
            {message.mode && <><span>·</span><span>orbe {message.mode}</span></>}
          </div>
        )}
        <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[var(--orbe-blue)] text-white rounded-tr-sm whitespace-pre-wrap"
            : "rounded-tl-sm")}>
          {isUser ? message.content : <MessageRenderer content={message.content} />}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {message.attachments.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1 text-[11px] bg-muted/40 rounded-full px-2 py-0.5">
                <Paperclip className="size-3" /> {a.name}
              </span>
            ))}
          </div>
        )}
        {!isUser && (
          <MessageToolbar
            onCopy={onCopy} onRegenerate={onRegenerate} onMemory={onMemory}
            onArtifact={onArtifact} onCompare={onCompare} onPin={onPin}
            pinned={message.pinned} disabled={disabled}
          />
        )}
      </div>
      {isUser && <Avatar className="size-7 mt-1"><AvatarFallback className="text-[10px] font-semibold bg-[var(--orbe-blue)]/15 text-[var(--orbe-blue)]">OA</AvatarFallback></Avatar>}
    </div>
  );
}

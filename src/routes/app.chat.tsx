import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassCard, Pill, StatusDot } from "@/components/design-system/Primitives";
import { chatService, memoryService, artifactService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { OrbeMark } from "@/components/design-system/OrbeLogo";
import type { ChatMode, Message, ModelKey } from "@/types";
import {
  ArrowUp, Copy, Image as ImageIcon, Mic, Paperclip, Pin, RefreshCw, Save,
  Search, Sparkles, Square, Wand2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "Chat · orbeAI" }] }),
  component: ChatPage,
});

const MODES: ChatMode[] = ["padrão", "strategist", "dev", "research", "document", "creative", "ops", "mentor", "safe"];
const MODELS: { key: ModelKey; label: string }[] = [
  { key: "auto", label: "automático (orbeRouter)" },
  { key: "gpt", label: "GPT" },
  { key: "claude", label: "Claude" },
  { key: "gemini", label: "Gemini" },
  { key: "qwen", label: "Qwen" },
  { key: "groq", label: "Groq" },
  { key: "local", label: "Local" },
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chats on mount (client only — localStore is SSR-safe but data is client data)
  useEffect(() => {
    void chatService.list().then((cs) => {
      setChats(cs);
      if (cs.length && !activeChatId) setActiveChatId(cs[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    void chatService.messages(activeChatId).then(setMessages);
  }, [activeChatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function newChat() {
    const chat = await chatService.create({ title: "Nova conversa", mode, model });
    const list = await chatService.list();
    setChats(list);
    setActiveChatId(chat.id);
    setMessages([]);
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming || !activeChatId) return;
    const userMsg: Message = { id: `u_${Date.now()}`, chatId: activeChatId, role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    await chatService.appendMessage(activeChatId, userMsg);
    setInput("");
    setStreaming(true);
    try {
      const { response, decision } = await chatService.send(activeChatId, text, { mode, model });
      const asst: Message = {
        id: `a_${Date.now()}`, chatId: activeChatId, role: "assistant",
        content: response.content + `\n\n_via ${response.provider} · ${decision.reason} · ${decision.qualityTier} · ~${decision.estimatedLatencyMs}ms_`,
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

  const filteredChats = chats.filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()));


  return (
    <div className="h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)] grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      {/* Conversation list */}
      <aside className="orbe-card p-3 hidden md:flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="text-sm font-semibold">Conversas</div>
          <Button size="sm" variant="ghost"><Sparkles className="size-3.5 mr-1" /> Nova</Button>
        </div>
        <div className="relative px-2 mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input placeholder="Buscar…" className="w-full bg-muted/40 rounded-md pl-7 pr-2 py-1.5 text-sm outline-none focus:orbe-ring" />
        </div>
        <ScrollArea className="flex-1 -mx-1 px-1">
          <ul className="space-y-1">
            {mockChats.map((c) => (
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
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <OrbeMark size={22} />
          <div className="text-sm font-medium">{mockChats.find((c) => c.id === activeChatId)?.title}</div>
          <Pill tone="blue">orbe {mode}</Pill>
          <div className="ml-auto flex items-center gap-2">
            <Select value={mode} onValueChange={(v) => setMode(v as ChatMode)}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="modo" /></SelectTrigger>
              <SelectContent>
                {MODES.map((m) => <SelectItem key={m} value={m}>orbe {m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={(v) => setModel(v as ModelKey)}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="modelo" /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-20">
              <Sparkles className="size-6 mx-auto text-[var(--orbe-blue)]" />
              <p className="mt-2">Comece a conversa. A orbeAI usa o modo selecionado e roteia para o melhor modelo.</p>
            </div>
          )}
          {messages.map((m) => <Bubble key={m.id} message={m} />)}
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
          <div className="orbe-glass rounded-2xl p-2 flex items-end gap-2">
            <Button variant="ghost" size="icon" title="Anexar"><Paperclip className="size-4" /></Button>
            <Button variant="ghost" size="icon" title="Imagem"><ImageIcon className="size-4" /></Button>
            <Button variant="ghost" size="icon" title="Voz"><Mic className="size-4" /></Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Converse com a orbeAI…"
              className="flex-1 border-0 bg-transparent resize-none min-h-[44px] max-h-40 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {streaming ? (
              <Button size="icon" variant="outline" onClick={() => setStreaming(false)} title="Parar"><Square className="size-4" /></Button>
            ) : (
              <Button size="icon" onClick={send} disabled={!input.trim()} title="Enviar"><ArrowUp className="size-4" /></Button>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground px-2">
            Enter envia · Shift+Enter quebra linha · respostas geradas pelo provedor mock até conectar APIs reais
          </div>
        </div>
      </section>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex items-start gap-3 animate-orbe-fade", isUser && "justify-end")}>
      {!isUser && <OrbeMark size={28} className="mt-1" />}
      <div className={cn("max-w-[78%]", isUser && "order-2")}>
        <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-[var(--orbe-blue)] text-white rounded-tr-sm"
            : "orbe-glass rounded-tl-sm")}>
          {message.content}
        </div>
        {!isUser && (
          <div className="mt-2 flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { navigator.clipboard.writeText(message.content); toast.success("Copiado"); }}>
              <Copy className="size-3 mr-1" /> Copiar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast("Regenerando…")}>
              <RefreshCw className="size-3 mr-1" /> Regenerar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.success("Salvo na memória")}>
              <Save className="size-3 mr-1" /> Memória
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.success("Transformado em artifact")}>
              <Wand2 className="size-3 mr-1" /> Artifact
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast("Comparando modelos…")}>
              <StatusDot tone="info" /> <span className="ml-1">Comparar</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.success("Mensagem fixada")}>
              <Pin className="size-3 mr-1" /> Fixar
            </Button>
          </div>
        )}
      </div>
      {isUser && <Avatar className="size-7 mt-1"><AvatarFallback className="text-[10px] font-semibold bg-[var(--orbe-blue)]/15 text-[var(--orbe-blue)]">OA</AvatarFallback></Avatar>}
    </div>
  );
}

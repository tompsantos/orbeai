import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemoryDialog } from "@/components/memory/MemoryDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { memoryService } from "@/lib/api";
import type { MemoryItem } from "@/types";
import { Brain, Check, Download, Pencil, Plus, Search, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/memory")({
  head: () => ({ meta: [{ title: "Memória · orbeAI" }] }),
  component: MemoryPage,
});

const TABS = ["todas", "global", "projeto", "sensível", "pendente", "arquivada"] as const;
type Tab = typeof TABS[number];

function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [tab, setTab] = useState<Tab>("todas");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<MemoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function refresh() { setItems(await memoryService.list()); }
  useEffect(() => { void refresh(); }, []);

  const filtered = items.filter((m) => {
    if (q && !(m.label.toLowerCase().includes(q.toLowerCase()) || m.content.toLowerCase().includes(q.toLowerCase()))) return false;
    if (tab === "todas") return true;
    if (tab === "global" || tab === "projeto" || tab === "sensível") return m.scope === tab;
    return m.status === tab;
  });

  async function onSubmit(data: { label: string; content: string; scope: MemoryItem["scope"]; status: MemoryItem["status"]; reason?: string }) {
    if (editing) {
      await memoryService.update(editing.id, data);
      toast.success("Memória atualizada");
    } else {
      await memoryService.create(data);
      toast.success("Memória criada");
    }
    setEditing(null);
    await refresh();
  }

  async function onApprove(id: string) { await memoryService.approve(id); toast.success("Memória aprovada"); await refresh(); }
  async function onReject(id: string) { await memoryService.reject(id); toast("Memória arquivada"); await refresh(); }

  async function onExport(m: MemoryItem) {
    const txt = `# ${m.label}\n\nEscopo: ${m.scope}\nFonte: ${m.source}\nStatus: ${m.status}\nConfiança: ${(m.confidence * 100).toFixed(0)}%\n\n${m.content}\n`;
    const blob = new Blob([txt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${m.label.replace(/\s+/g, "_")}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  async function onRemove() {
    if (!removeId) return;
    await memoryService.remove(removeId);
    setRemoveId(null);
    toast.success("Memória removida");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="memory center" title="Memória transparente e controlável"
        description="Você decide o que a orbeAI lembra, edita ou apaga."
        action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4 mr-1" /> Nova memória</Button>} />

      <GlassCard className="border-[var(--orbe-blue)]/30">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--orbe-blue)] to-[var(--orbe-cyan)] flex items-center justify-center"><Shield className="size-5 text-white" /></div>
          <div>
            <div className="font-semibold">Política de memória</div>
            <p className="text-sm text-muted-foreground mt-1">
              A orbeAI usa memória para manter contexto, mas o usuário sempre controla o que é salvo, editado ou apagado.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-full text-xs border transition",
                tab === t ? "bg-[var(--orbe-blue)] text-white border-transparent" : "hover:bg-accent/50")}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar memórias…" className="pl-9 h-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Brain className="size-6" />}
          title="Nenhuma memória neste filtro"
          description="Crie uma nova memória manual ou ajuste os filtros."
          action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4 mr-1" /> Nova memória</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <GlassCard key={m.id} className={cn(m.scope === "sensível" && "border-[var(--warning)]/40")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-[var(--orbe-blue)]" />
                    <span className="font-medium text-sm truncate">{m.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{m.content}</p>
                  {(m as MemoryItem & { reason?: string }).reason && (
                    <p className="text-[11px] italic text-muted-foreground mt-1">motivo: {(m as MemoryItem & { reason?: string }).reason}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <Pill tone={m.scope === "sensível" ? "warn" : m.scope === "global" ? "blue" : "muted"}>{m.scope}</Pill>
                    <Pill tone="muted">fonte: {m.source}</Pill>
                    <Pill tone="muted">conf. {(m.confidence * 100).toFixed(0)}%</Pill>
                    <Pill tone={m.status === "ativa" ? "success" : m.status === "pendente" ? "warn" : "muted"}>{m.status}</Pill>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2">
                    usada {formatDistanceToNow(new Date(m.lastUsed), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {m.status === "pendente" && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => onApprove(m.id)} title="Aprovar"><Check className="size-3.5 text-[var(--success)]" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => onReject(m.id)} title="Arquivar"><X className="size-3.5" /></Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setDialogOpen(true); }} title="Editar"><Pencil className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onExport(m)} title="Exportar"><Download className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setRemoveId(m.id)} title="Remover"><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <MemoryDialog open={dialogOpen} onOpenChange={setDialogOpen}
        initial={editing ?? undefined} onSubmit={onSubmit} />
      <ConfirmDialog open={!!removeId} onOpenChange={(v) => !v && setRemoveId(null)}
        title="Remover memória?" description="Esta ação não pode ser desfeita."
        confirmLabel="Remover" destructive onConfirm={onRemove} />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { mockMemory } from "@/lib/mock/data";
import { Brain, Download, Pencil, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/memory")({
  head: () => ({ meta: [{ title: "Memória · orbeAI" }] }),
  component: MemoryPage,
});

const TABS = ["todas", "global", "projeto", "sensível", "pendente", "arquivada"] as const;

function MemoryPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="memory center" title="Memória transparente e controlável"
        description="Você decide o que a orbeAI lembra, edita ou apaga." />

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

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => <Pill key={t} tone={t === "todas" ? "blue" : "muted"}>{t}</Pill>)}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {mockMemory.map((m) => (
          <GlassCard key={m.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-[var(--orbe-blue)]" />
                  <span className="font-medium text-sm">{m.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{m.content}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <Pill tone={m.scope === "sensível" ? "warn" : m.scope === "global" ? "blue" : "muted"}>{m.scope}</Pill>
                  <Pill tone="muted">fonte: {m.source}</Pill>
                  <Pill tone="muted">conf. {(m.confidence * 100).toFixed(0)}%</Pill>
                  <Pill tone={m.status === "ativa" ? "success" : m.status === "pendente" ? "warn" : "muted"}>{m.status}</Pill>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" onClick={() => toast.success("Editado")}><Pencil className="size-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => toast.success("Exportado")}><Download className="size-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => toast("Memória removida")}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

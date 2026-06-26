import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockArtifacts } from "@/lib/mock/data";
import type { Artifact } from "@/types";
import { Copy, Download, History, MessageSquare, Plus, Save, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/artifacts")({
  head: () => ({ meta: [{ title: "Artifact studio · orbeAI" }] }),
  component: ArtifactsPage,
});

const KINDS = ["documento", "prompt", "código", "relatório", "plano de ação", "tabela", "json", "playbook", "contrato", "landing page", "checklist"] as const;

function ArtifactsPage() {
  const [active, setActive] = useState<Artifact>(mockArtifacts[0]);
  const [content, setContent] = useState(active.content);

  function switchTo(a: Artifact) { setActive(a); setContent(a.content); }

  return (
    <div className="space-y-5">
      <SectionHeader eyebrow="artifact studio" title="Criação editável com versão"
        description="Documentos, código, planos e relatórios — gerados, editados e versionados."
        action={<Button><Plus className="size-4 mr-1" /> Novo artifact</Button>} />

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <aside className="orbe-card p-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground px-2 mb-2">Seus artifacts</div>
          <ul className="space-y-1">
            {mockArtifacts.map((a) => (
              <li key={a.id}>
                <button onClick={() => switchTo(a)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent/50 transition ${active.id === a.id ? "bg-accent/70 orbe-glow" : ""}`}>
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground">{a.kind}</div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 px-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tipos</div>
            <div className="flex flex-wrap gap-1">
              {KINDS.map((k) => <Pill key={k} tone="muted">{k}</Pill>)}
            </div>
          </div>
        </aside>

        <section className="grid lg:grid-cols-2 gap-4 min-h-[60vh]">
          {/* Instructions */}
          <GlassCard className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="size-4 text-[var(--orbe-blue)]" />
              <div className="font-semibold text-sm">Instruções para a orbeAI</div>
            </div>
            <Textarea placeholder="Descreva como melhorar este artifact, mudar tom, expandir seção, transformar formato…"
              className="flex-1 min-h-[180px] bg-muted/20" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm"><Wand2 className="size-3.5 mr-1" /> Melhorar com IA</Button>
              <Button size="sm" variant="outline">Transformar formato</Button>
              <Button size="sm" variant="ghost" onClick={() => toast.success("Comentário registrado")}>Comentar seleção</Button>
            </div>
          </GlassCard>

          {/* Preview */}
          <GlassCard className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{active.kind}</div>
                <div className="font-semibold">{active.title}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" title="Histórico"><History className="size-4" /></Button>
                <Button size="icon" variant="ghost" title="Copiar" onClick={() => { navigator.clipboard.writeText(content); toast.success("Copiado"); }}><Copy className="size-4" /></Button>
                <Button size="icon" variant="ghost" title="Exportar"><Download className="size-4" /></Button>
                <Button size="sm" onClick={() => toast.success("Salvo")}><Save className="size-3.5 mr-1" /> Salvar</Button>
              </div>
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 font-mono text-xs min-h-[280px]" />
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{active.versions.length} versões</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="size-3 text-[var(--orbe-blue)]" /> editável</span>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}

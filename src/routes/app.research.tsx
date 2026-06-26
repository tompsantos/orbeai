import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { mockResearch } from "@/lib/mock/data";
import { AlertTriangle, Download, FileSearch, FlaskConical, Globe, Library, Save, Send, Workflow } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/research")({
  head: () => ({ meta: [{ title: "Pesquisa profunda · orbeAI" }] }),
  component: ResearchPage,
});

const SOURCES = [
  { id: "web", label: "Web", icon: Globe },
  { id: "files", label: "Arquivos do projeto", icon: FileSearch },
  { id: "internal", label: "Base interna orbeOne", icon: Library },
  { id: "uploads", label: "Documentos enviados", icon: FileSearch },
  { id: "integrations", label: "Integrações conectadas", icon: Workflow },
];

function ResearchPage() {
  const [q, setQ] = useState("Quem são os concorrentes globais de cockpits cognitivos enterprise?");
  const [selected, setSelected] = useState<string[]>(["web", "internal"]);
  const report = mockResearch[0];

  function toggle(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="research lab" title="Pesquisa profunda multifonte"
        description="Plano de pesquisa, fontes, evidências, incertezas e síntese executiva." />

      <GlassCard>
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Pergunta de pesquisa</label>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Formule a pergunta…" />
            <Button onClick={() => toast.success("Pesquisa iniciada")}><Send className="size-4 mr-1" /> Iniciar</Button>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Fontes</div>
            <div className="flex flex-wrap gap-3">
              {SOURCES.map((s) => {
                const Icon = s.icon; const on = selected.includes(s.id);
                return (
                  <label key={s.id} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${on ? "border-[var(--orbe-blue)] bg-[color-mix(in_oklch,var(--orbe-blue)_8%,transparent)]" : ""}`}>
                    <Checkbox checked={on} onCheckedChange={() => toggle(s.id)} />
                    <Icon className="size-4 text-[var(--orbe-blue)]" /> {s.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2">
          <SectionHeader eyebrow="plano de pesquisa" title="Etapas previstas" />
          <ol className="space-y-3">
            {report.plan.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-gradient-to-br from-[var(--orbe-blue)] to-[var(--orbe-cyan)] text-white text-xs flex items-center justify-center">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm">{step}</div>
                  <Progress value={i === 0 ? 100 : i === 1 ? 60 : 20} className="mt-1.5 h-1.5" />
                </div>
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard>
          <SectionHeader eyebrow="ações" title="Exportar resultados" />
          <div className="flex flex-col gap-2">
            <Button variant="outline"><Download className="size-4 mr-1" /> Exportar relatório</Button>
            <Button variant="outline"><Save className="size-4 mr-1" /> Salvar como artifact</Button>
          </div>
        </GlassCard>
      </div>

      <SectionHeader eyebrow="fontes encontradas" title="Evidências coletadas" />
      <div className="grid md:grid-cols-3 gap-3">
        {report.sources.map((s) => (
          <GlassCard key={s.id}>
            <div className="flex items-center justify-between">
              <Pill tone="blue">{s.kind}</Pill>
              <span className="text-xs text-muted-foreground">conf. {(s.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="font-medium mt-2 text-sm">{s.title}</div>
            <p className="text-xs text-muted-foreground mt-2">{s.excerpt}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <SectionHeader eyebrow="síntese executiva" title="Resumo" />
          <p className="text-sm">{report.summary}</p>
        </GlassCard>
        <GlassCard>
          <SectionHeader eyebrow="incertezas e riscos" title="O que ainda não é certo" />
          <ul className="space-y-2">
            {report.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="size-4 text-[var(--warning)] mt-0.5" /> {r}</li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
        <FlaskConical className="size-3.5" /> orbe research conduz a investigação com transparência e citações.
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { mockProviders } from "@/lib/mock/data";
import type { RoutingMode } from "@/types";
import { Activity, Cpu, KeyRound, Route as RouteIcon, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/models")({
  head: () => ({ meta: [{ title: "Modelos · orbeAI" }] }),
  component: ModelsPage,
});

const MODES: RoutingMode[] = ["automático", "menor custo", "melhor qualidade", "mais rápido", "raciocínio profundo", "código", "pesquisa", "documento", "multimodal"];

function ModelsPage() {
  const [mode, setMode] = useState<RoutingMode>("automático");
  const [def, setDef] = useState<string>("anthropic");

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="model router" title="Roteamento inteligente de modelos"
        description="orbeRouter escolhe o melhor provedor por tarefa, custo e latência." />

      <GlassCard>
        <SectionHeader eyebrow="modo de roteamento" title="Como a orbeAI escolhe modelos" />
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${mode === m ? "bg-[var(--orbe-blue)] text-white border-transparent" : "hover:bg-accent/50"}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <RouteIcon className="inline size-3.5 mr-1" /> Cadeia de fallback: anthropic → openai → gemini → mock
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mockProviders.map((p) => (
          <GlassCard key={p.slug} className="orbe-card-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-gradient-to-br from-[var(--orbe-blue)] to-[var(--orbe-cyan)] flex items-center justify-center"><Cpu className="size-4 text-white" /></div>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.models.length} modelos</div>
                </div>
              </div>
              <Pill tone={p.status === "online" ? "success" : p.status === "placeholder" ? "muted" : "warn"}>{p.status}</Pill>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-muted/30 p-2"><Activity className="inline size-3 mr-1" /> {p.latencyMs ?? "—"} ms</div>
              <div className="rounded-md bg-muted/30 p-2"><Zap className="inline size-3 mr-1" /> ${p.costPerKTokens?.toFixed(3) ?? "0.000"}/1k</div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Modelos</div>
              <div className="flex flex-wrap gap-1">{p.models.map((m) => <Pill key={m} tone="muted">{m}</Pill>)}</div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1"><KeyRound className="size-3" /> {p.apiKeyStatus}</span>
              <Button size="sm" variant={def === p.slug ? "default" : "outline"} onClick={() => { setDef(p.slug); toast.success(`${p.name} definido como padrão`); }}>
                {def === p.slug ? "Padrão" : "Definir padrão"}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

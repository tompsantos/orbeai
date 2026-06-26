import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { modelService } from "@/lib/api";
import { resolveRoute } from "@/lib/ai/router";
import type { ModelConfig, ModelProvider, ProviderSlug, RoutingMode } from "@/types";
import { Activity, AlertTriangle, Cpu, KeyRound, Route as RouteIcon, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/models")({
  head: () => ({ meta: [{ title: "Modelos · orbeAI" }] }),
  component: ModelsPage,
});

const MODES: RoutingMode[] = ["automático", "menor custo", "melhor qualidade", "mais rápido", "raciocínio profundo", "código", "pesquisa", "documento", "multimodal"];
const ALL: ProviderSlug[] = ["anthropic", "openai", "gemini", "groq", "qwen", "local", "mock"];

function ModelsPage() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [config, setConfig] = useState<ModelConfig | null>(null);

  async function refresh() {
    const [ps, cfg] = await Promise.all([modelService.providers(), modelService.getConfig()]);
    setProviders(ps); setConfig(cfg);
  }
  useEffect(() => { void refresh(); }, []);

  const preview = useMemo(() => config ? resolveRoute({ routingMode: config.routingMode }) : null, [config]);

  if (!config) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;

  async function setDefault(slug: ProviderSlug) { await modelService.setDefaultProvider(slug); toast.success(`Padrão: ${slug}`); await refresh(); }
  async function setMode(mode: RoutingMode) { await modelService.setRoutingMode(mode); await refresh(); }
  async function toggleFallback(slug: ProviderSlug) {
    const chain = config!.fallbackChain.includes(slug)
      ? config!.fallbackChain.filter((p) => p !== slug)
      : [...config!.fallbackChain, slug];
    await modelService.setFallbackChain(chain);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="model router" title="Roteamento inteligente de modelos"
        description="orbeRouter escolhe o melhor provedor por tarefa, custo e latência." />

      <GlassCard className="border-[var(--warning)]/30">
        <div className="flex items-start gap-3 text-sm">
          <AlertTriangle className="size-4 text-[var(--warning)] mt-0.5" />
          <div>
            <div className="font-medium">Chaves reais entram server-side depois.</div>
            <p className="text-muted-foreground mt-1">A configuração aqui é local. Provedores reais só serão chamados após plugar variáveis de ambiente no backend.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader eyebrow="modo de roteamento" title="Como a orbeAI escolhe modelos" />
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("px-3 py-1.5 rounded-full text-xs border transition",
                config.routingMode === m ? "bg-[var(--orbe-blue)] text-white border-transparent" : "hover:bg-accent/50")}>
              {m}
            </button>
          ))}
        </div>
        {preview && (
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-md bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">decisão preview</div>
              <div className="mt-1 font-medium">{preview.provider} · {preview.qualityTier}</div>
              <div className="text-muted-foreground">{preview.reason}</div>
              <div className="text-muted-foreground mt-1">~{preview.estimatedLatencyMs}ms · US$ {preview.estimatedCostUsd.toFixed(4)}/1k</div>
            </div>
            <div className="rounded-md bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">cadeia de fallback</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs"><RouteIcon className="size-3" /> {config.fallbackChain.join(" → ")}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {ALL.map((slug) => (
                  <button key={slug} onClick={() => toggleFallback(slug)}
                    className={cn("px-2 py-0.5 rounded text-[11px] border",
                      config.fallbackChain.includes(slug) ? "bg-[var(--orbe-blue)] text-white border-transparent" : "hover:bg-accent/40")}>
                    {slug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((p) => (
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
              <Button size="sm" variant={config.defaultProvider === p.slug ? "default" : "outline"} onClick={() => setDefault(p.slug)}>
                {config.defaultProvider === p.slug ? "Padrão" : "Definir padrão"}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

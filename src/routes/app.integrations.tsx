import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { integrationService } from "@/lib/api";
import type { Integration } from "@/types";
import { Plug, Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/integrations")({
  head: () => ({ meta: [{ title: "Integrações · orbeAI" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  async function refresh() { setItems(await integrationService.list()); }
  useEffect(() => { void refresh(); }, []);

  const grouped = items.reduce<Record<string, Integration[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it); return acc;
  }, {});

  async function toggle(it: Integration) {
    if (it.status === "conectado") {
      await integrationService.disconnect(it.slug);
      toast(`${it.name} desconectado`);
    } else {
      await integrationService.connect(it.slug);
      toast.success(`${it.name} conectado`);
    }
    await refresh();
  }

  async function configure(it: Integration) {
    await integrationService.configure(it.slug);
    toast.success(`${it.name} configurado (mock)`);
    await refresh();
  }

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="integration hub" title="Conecte a orbeAI ao seu mundo"
        description="Produtividade, dados, dev, comunicação e todo o ecossistema orbeOne." />

      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat} className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{cat}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((it) => (
              <GlassCard key={it.slug} className="orbe-card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-muted/50 flex items-center justify-center"><Plug className="size-4 text-[var(--orbe-blue)]" /></div>
                    <div className="font-medium">{it.name}</div>
                  </div>
                  <Pill tone={it.status === "conectado" ? "success" : it.status === "configurar" ? "warn" : "muted"}>{it.status}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{it.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {it.permissions.map((p) => <span key={p} className="text-[10px] rounded bg-muted/50 px-1.5 py-0.5">{p}</span>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => toggle(it)}>
                    {it.status === "conectado" ? "Desconectar" : "Conectar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => configure(it)} title="Configurar"><Settings className="size-3.5" /></Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

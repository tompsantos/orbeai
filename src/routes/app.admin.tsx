import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAudit, mockFlags, mockUsage } from "@/lib/mock/data";
import { Switch } from "@/components/ui/switch";
import { Activity, AlertTriangle, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin · orbeAI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const totalTokens = mockUsage.reduce((s, u) => s + u.tokens, 0);
  const totalCost = mockUsage.reduce((s, u) => s + u.costUsd, 0);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="admin cockpit" title="Operação, segurança e telemetria"
        description="Visão executiva do workspace, modelos, auditoria e flags." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={<Users className="size-4" />} label="Usuários" value="24" hint="3 admins" />
        <Metric icon={<Activity className="size-4" />} label="Tokens (7d)" value={totalTokens.toLocaleString("pt-BR")} hint="todos os provedores" />
        <Metric icon={<ShieldCheck className="size-4" />} label="Eventos de segurança" value="0" hint="últimos 7 dias" />
        <Metric icon={<AlertTriangle className="size-4" />} label="Custo estimado" value={`$${totalCost.toFixed(2)}`} hint="mock" />
      </div>

      <Tabs defaultValue="audit">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="usage">Uso de modelos</TabsTrigger>
          <TabsTrigger value="flags">Feature flags</TabsTrigger>
          <TabsTrigger value="health">Saúde do sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-5">
          <GlassCard>
            <ul className="divide-y">
              {mockAudit.map((log: any) => (
                <li key={log.id} className="py-3 flex items-center gap-3 text-sm">
                  <Pill tone={log.level === "error" ? "warn" : log.level === "warn" ? "warn" : "muted"}>{log.level}</Pill>
                  <span className="font-medium">{log.actor}</span>
                  <span className="text-muted-foreground">{log.action}</span>
                  <span className="text-muted-foreground">→ {log.target}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(log.at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </TabsContent>

        <TabsContent value="usage" className="mt-5">
          <GlassCard>
            <ul className="divide-y">
              {mockUsage.map((u, i) => (
                <li key={i} className="py-3 flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-24">{u.date}</span>
                  <Pill tone="blue">{u.provider}</Pill>
                  <span>{u.tokens.toLocaleString("pt-BR")} tokens</span>
                  <span className="text-muted-foreground">{u.requests} req</span>
                  <span className="ml-auto">${u.costUsd.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </TabsContent>

        <TabsContent value="flags" className="mt-5">
          <div className="grid md:grid-cols-2 gap-3">
            {mockFlags.map((f: any) => (
              <GlassCard key={f.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground">{f.key} · {f.audience}</div>
                  </div>
                  <Switch checked={f.enabled} />
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-5">
          <GlassCard>
            <ul className="text-sm space-y-2">
              <li>✅ API gateway: operacional</li>
              <li>✅ Mock provider: 100% disponibilidade</li>
              <li>✅ Memória vetorial: simulada, ok</li>
              <li>⚠️ Provedores reais: aguardando chaves</li>
            </ul>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </GlassCard>
  );
}

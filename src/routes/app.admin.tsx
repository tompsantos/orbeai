import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, Pill, SectionHeader, StatCard, StatusDot } from "@/components/design-system/Primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { adminService } from "@/lib/api";
import { localStore } from "@/lib/storage/localStore";
import type { AuditLog, FeatureFlag, UsageMetric } from "@/types";
import { Activity, AlertTriangle, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin · orbeAI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usage, setUsage] = useState<UsageMetric[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<AuditLog["level"] | "todos">("todos");
  const [resetOpen, setResetOpen] = useState(false);

  async function refresh() {
    const [a, u, f] = await Promise.all([
      adminService.audit({ q: q || undefined, level: level === "todos" ? undefined : level }),
      adminService.usage(), adminService.flags(),
    ]);
    setLogs(a); setUsage(u); setFlags(f);
  }
  useEffect(() => { void refresh(); }, [q, level]);

  const totalTokens = usage.reduce((s, u) => s + u.tokens, 0);
  const totalCost = usage.reduce((s, u) => s + u.costUsd, 0);

  async function onToggleFlag(key: string) {
    await adminService.toggleFlag(key);
    toast.success("Flag atualizada");
    await refresh();
  }

  function onReset() {
    localStore.resetDemoData();
    toast.success("Dados de demonstração resetados");
    setResetOpen(false);
    void refresh();
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="admin cockpit" title="Operação, segurança e telemetria"
        description="Visão executiva do workspace, modelos, auditoria e flags."
        action={<Button variant="outline" size="sm" onClick={() => setResetOpen(true)}><RefreshCw className="size-4 mr-1" /> Reset demo data</Button>} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Usuários" value="24" hint="3 admins" />
        <StatCard icon={Activity} label="Tokens (7d)" value={totalTokens.toLocaleString("pt-BR")} hint="todos os provedores" />
        <StatCard icon={ShieldCheck} label="Eventos de auditoria" value={logs.length.toString()} hint="locais" />
        <StatCard icon={AlertTriangle} label="Custo estimado" value={`$${totalCost.toFixed(2)}`} hint="mock" />
      </div>

      <Tabs defaultValue="audit">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="usage">Uso de modelos</TabsTrigger>
          <TabsTrigger value="flags">Feature flags</TabsTrigger>
          <TabsTrigger value="users">Workspaces</TabsTrigger>
          <TabsTrigger value="health">Saúde do sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-5 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Buscar ação, alvo, ator…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <Select value={level} onValueChange={(v) => setLevel(v as AuditLog["level"] | "todos")}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">todos</SelectItem>
                <SelectItem value="info">info</SelectItem>
                <SelectItem value="warn">warn</SelectItem>
                <SelectItem value="error">error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <GlassCard hoverable={false}>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {logs.map((log) => (
                  <li key={log.id} className="py-3 flex items-center gap-3 text-sm flex-wrap first:pt-0 last:pb-0">
                    <Pill tone={log.level === "error" ? "danger" : log.level === "warn" ? "warn" : "muted"}>{log.level}</Pill>
                    <span className="font-medium">{log.actor}</span>
                    <span className="text-muted-foreground">{log.action}</span>
                    <span className="text-muted-foreground">→ {log.target}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{new Date(log.at).toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="usage" className="mt-5">
          <GlassCard hoverable={false}>
            <ul className="divide-y divide-border/60">
              {usage.map((u, i) => (
                <li key={i} className="py-3 flex items-center gap-3 text-sm flex-wrap first:pt-0 last:pb-0">
                  <span className="text-muted-foreground w-24 tabular-nums">{u.date}</span>
                  <Pill tone="blue">{u.provider}</Pill>
                  <span className="tabular-nums">{u.tokens.toLocaleString("pt-BR")} tokens</span>
                  <span className="text-muted-foreground tabular-nums">{u.requests} req</span>
                  <span className="ml-auto tabular-nums font-medium">${u.costUsd.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </TabsContent>

        <TabsContent value="flags" className="mt-5">
          <div className="grid md:grid-cols-2 gap-3">
            {flags.map((f) => (
              <GlassCard key={f.key} className={cn(f.enabled && "orbe-active")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      <StatusDot tone={f.enabled ? "success" : "neutral"} pulse={false} />
                      {f.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 font-mono">{f.key} · {f.audience}</div>
                  </div>
                  <Switch checked={f.enabled} onCheckedChange={() => onToggleFlag(f.key)} />
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          <GlassCard>
            <ul className="divide-y text-sm">
              <li className="py-3 flex justify-between"><span className="font-medium">orbeOne HQ</span><span className="text-muted-foreground">enterprise · 24 seats</span></li>
              <li className="py-3 flex justify-between"><span>orbeOne Admin · admin@orbeone.com.br</span><Pill tone="blue">owner</Pill></li>
              <li className="py-3 flex justify-between"><span className="text-muted-foreground">Demais usuários demo</span><span className="text-muted-foreground">23</span></li>
            </ul>
          </GlassCard>
        </TabsContent>

        <TabsContent value="health" className="mt-5">
          <GlassCard hoverable={false}>
            <ul className="text-sm divide-y divide-border/60">
              {[
                { tone: "success" as const, label: "API gateway", value: "operacional" },
                { tone: "success" as const, label: "Mock provider", value: "100% disponibilidade" },
                { tone: "success" as const, label: "Memória vetorial", value: "simulada, ok" },
                { tone: "warn" as const, label: "Provedores reais", value: "aguardando chaves server-side" },
              ].map((h) => (
                <li key={h.label} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                  <StatusDot tone={h.tone} />
                  <span className="font-medium">{h.label}</span>
                  <span className="ml-auto text-muted-foreground text-xs">{h.value}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={resetOpen} onOpenChange={setResetOpen}
        title="Resetar dados de demonstração?"
        description="Isso vai apagar todos os dados locais (chats, projetos, artifacts, memória) e restaurar o mock inicial."
        confirmLabel="Resetar" destructive onConfirm={onReset} />
    </div>
  );
}

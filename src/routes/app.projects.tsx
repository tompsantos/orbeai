import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/app/projects")({
  component: () => {
    const path = useRouterState({ select: (s) => s.location.pathname });
    // If a child route is active, render only the outlet
    if (path !== "/app/projects" && path !== "/app/projects/") return <Outlet />;
    return <ProjectsIndex />;
  },
  head: () => ({ meta: [{ title: "Projetos · orbeAI" }] }),
});

import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockProjects } from "@/lib/mock/data";
import { Filter, Folders, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

function ProjectsIndex() {
  const [q, setQ] = useState("");
  const filtered = mockProjects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="projetos inteligentes" title="Seus espaços de trabalho"
        description="Cada projeto tem chat, arquivos, memória, artifacts e agentes próprios."
        action={<Button><Plus className="size-4 mr-1" /> Novo projeto</Button>} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar projetos…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="size-4 mr-1" /> Filtros</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Link key={p.id} to="/app/projects/$id" params={{ id: p.id }} className="orbe-card orbe-card-hover p-5 block">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-gradient-to-br from-[var(--orbe-blue)] to-[var(--orbe-cyan)] flex items-center justify-center"><Folders className="size-4 text-white" /></div>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.product}</div>
                </div>
              </div>
              <Pill tone={p.status === "ativo" ? "success" : p.status === "rascunho" ? "muted" : "warn"}>{p.status}</Pill>
            </div>
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="chats" value={p.chatsCount} />
              <Stat label="artifacts" value={p.artifactsCount} />
              <Stat label="arquivos" value={p.filesCount} />
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Atualizado {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: ptBR })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 py-2">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

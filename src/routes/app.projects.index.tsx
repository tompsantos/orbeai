import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { projectService } from "@/lib/api";
import type { Project } from "@/types";
import { Filter, Folders, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/projects/")({
  head: () => ({ meta: [{ title: "Projetos · orbeAI" }] }),
  component: ProjectsIndex,
});

function ProjectsIndex() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  async function refresh() { setProjects(await projectService.list()); }
  useEffect(() => { void refresh(); }, []);

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  async function onCreate(data: Partial<Project> & { name: string }) {
    await projectService.create(data);
    toast.success("Projeto criado");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="projetos inteligentes" title="Seus espaços de trabalho"
        description="Cada projeto tem chat, arquivos, memória, artifacts e agentes próprios."
        action={<Button onClick={() => setOpen(true)}><Plus className="size-4 mr-1" /> Novo projeto</Button>} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar projetos…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="size-4 mr-1" /> Filtros</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Folders className="size-6" />} title="Nenhum projeto"
          description="Crie seu primeiro projeto para organizar conversas, artifacts e memória."
          action={<Button onClick={() => setOpen(true)}><Plus className="size-4 mr-1" /> Novo projeto</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} to="/app/projects/$id" params={{ id: p.id }} className="orbe-card orbe-card-hover p-5 block">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-lg bg-gradient-to-br from-[var(--orbe-blue)] to-[var(--orbe-cyan)] flex items-center justify-center"><Folders className="size-4 text-white" /></div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.product ?? "sem produto"}</div>
                  </div>
                </div>
                <Pill tone={p.status === "ativo" ? "success" : p.status === "rascunho" ? "muted" : "warn"}>{p.status}</Pill>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { l: "chats", v: p.chatsCount },
                  { l: "artifacts", v: p.artifactsCount },
                  { l: "arquivos", v: p.filesCount },
                ].map((s) => (
                  <div key={s.l} className="rounded-md bg-muted/40 py-2">
                    <div className="text-sm font-semibold">{s.v}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Atualizado {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: ptBR })}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProjectDialog open={open} onOpenChange={setOpen} onSubmit={onCreate} />
    </div>
  );
}

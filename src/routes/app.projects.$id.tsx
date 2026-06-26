import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GlassCard, Pill, SectionHeader } from "@/components/design-system/Primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { mockArtifacts, mockMemory, mockProjects } from "@/lib/mock/data";
import { ArrowLeft, Bot, FileText, MessageSquare, Settings, Sparkles, Workflow } from "lucide-react";

export const Route = createFileRoute("/app/projects/$id")({
  head: ({ params }) => ({ meta: [{ title: `Projeto ${params.id} · orbeAI` }] }),
  loader: ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectPage,
  notFoundComponent: () => <div className="p-8">Projeto não encontrado. <Link to="/app/projects" className="text-[var(--orbe-blue)]">Voltar</Link></div>,
  errorComponent: ({ error, reset }) => (
    <div className="p-8 space-y-3">
      <div>Erro ao carregar projeto.</div>
      <Button size="sm" onClick={() => reset()}>Tentar novamente</Button>
    </div>
  ),
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const artifacts = mockArtifacts.filter((a) => a.projectId === project.id);
  const memories = mockMemory.filter((m) => m.projectId === project.id);

  return (
    <div className="space-y-6">
      <Link to="/app/projects" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
        <ArrowLeft className="size-3.5" /> Projetos
      </Link>

      <section className="orbe-glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <Pill tone={project.status === "ativo" ? "success" : "muted"}>{project.status}</Pill>
            {project.product && <Pill tone="blue">{project.product}</Pill>}
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/app/chat"><MessageSquare className="size-4 mr-1" /> Abrir chat</Link></Button>
          <Button><Sparkles className="size-4 mr-1" /> Novo artifact</Button>
        </div>
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="memory">Memória</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="decisions">Decisões</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-5">
          <div className="grid lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2">
              <SectionHeader eyebrow="brief" title="Inteligência do projeto" />
              <p className="text-sm text-muted-foreground">{project.brief ?? "Brief ainda não definido. Use o chat para gerar um."}</p>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="chats" value={project.chatsCount} />
                <Stat label="artifacts" value={project.artifactsCount} />
                <Stat label="arquivos" value={project.filesCount} />
                <Stat label="agentes" value={project.agents.length} />
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader eyebrow="agentes ativos" title="Time cognitivo" />
              <ul className="space-y-2">
                {project.agents.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm"><Bot className="size-4 text-[var(--orbe-blue)]" /> {a}</li>
                ))}
              </ul>
            </GlassCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <GlassCard>
              <SectionHeader eyebrow="decisões recentes" title="O que foi decidido" />
              <ul className="space-y-3 text-sm">
                <li>✓ Adotar narrativa "sistema operacional cognitivo".</li>
                <li>✓ Priorizar qualidade no modo strategist.</li>
                <li>⏳ Definir política de memória sensível.</li>
              </ul>
            </GlassCard>
            <GlassCard>
              <SectionHeader eyebrow="tarefas pendentes" title="Próximos passos" />
              <ul className="space-y-3 text-sm">
                <li>• Pesquisa profunda — concorrentes globais</li>
                <li>• Validar landing premium</li>
                <li>• Conectar provedor real (Anthropic)</li>
              </ul>
            </GlassCard>
          </div>

          <GlassCard>
            <SectionHeader eyebrow="integração com produtos" title="Ecossistema conectado" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["orbeVault", "orbeRadar", "orbeRisk", "orbeAuto"].map((n) => (
                <div key={n} className="rounded-lg border p-3 flex items-center gap-2"><Workflow className="size-4 text-[var(--orbe-blue)]" /> <span className="text-sm">{n}</span></div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <GlassCard><p className="text-sm text-muted-foreground">Abra o chat do projeto. <Link to="/app/chat" className="text-[var(--orbe-blue)]">Ir para o chat →</Link></p></GlassCard>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <GlassCard>
            <SectionHeader eyebrow="arquivos" title={`${project.filesCount} arquivos`} />
            <ul className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="py-3 flex items-center gap-3 text-sm"><FileText className="size-4 text-muted-foreground" /> documento-{i + 1}.pdf <span className="ml-auto text-xs text-muted-foreground">{(i + 1) * 320} KB</span></li>
              ))}
            </ul>
          </GlassCard>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <div className="grid md:grid-cols-2 gap-3">
            {memories.length === 0 && <GlassCard><p className="text-sm text-muted-foreground">Nenhuma memória deste projeto ainda.</p></GlassCard>}
            {memories.map((m) => (
              <GlassCard key={m.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{m.label}</div>
                  <Pill tone={m.status === "ativa" ? "success" : m.status === "pendente" ? "warn" : "muted"}>{m.status}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{m.content}</p>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="artifacts" className="mt-6">
          <div className="grid md:grid-cols-2 gap-3">
            {artifacts.length === 0 && <GlassCard><p className="text-sm text-muted-foreground">Nenhum artifact criado.</p></GlassCard>}
            {artifacts.map((a) => (
              <GlassCard key={a.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{a.title}</div>
                  <Pill tone="blue">{a.kind}</Pill>
                </div>
                <pre className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-5">{a.content}</pre>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <div className="grid md:grid-cols-3 gap-3">
            {project.agents.map((a) => (
              <GlassCard key={a}><div className="flex items-center gap-2"><Bot className="size-4 text-[var(--orbe-blue)]" /> <span className="font-medium text-sm">{a}</span></div></GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="mt-6">
          <GlassCard><p className="text-sm text-muted-foreground">Centro de decisões em construção.</p></GlassCard>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <GlassCard>
            <SectionHeader eyebrow="configurações" title="Política deste projeto" />
            <ul className="text-sm space-y-2">
              <li><Settings className="inline size-4 mr-2 text-muted-foreground" /> Modo de memória: <b>{project.memoryMode}</b></li>
              <li><Settings className="inline size-4 mr-2 text-muted-foreground" /> Produto associado: <b>{project.product ?? "—"}</b></li>
            </ul>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GlassCard, Pill, SectionHeader, StatusDot } from "@/components/design-system/Primitives";
import {
  Activity, ArrowUpRight, Bot, FileText, FlaskConical, GitBranch, LineChart,
  MessageSquare, Network, Plus, Sparkles, Workflow,
} from "lucide-react";
import { mockChats, mockProjects, mockProviders, orbeProducts, mockUsage } from "@/lib/mock/data";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Cockpit · orbeAI" }] }),
  component: Cockpit,
});

function Cockpit() {
  const totalCost = mockUsage.reduce((a, b) => a + b.costUsd, 0);
  const totalTokens = mockUsage.reduce((a, b) => a + b.tokens, 0);

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <section className="orbe-glass rounded-3xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 size-72 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, var(--orbe-blue), transparent 60%)" }} />
        <Pill tone="blue">cockpit cognitivo</Pill>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
          <span className="orbe-gradient-text">orbeAI</span>
        </h1>
        <p className="mt-2 text-lg text-foreground/85">o sistema operacional cognitivo da orbeOne.</p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Comece uma conversa, abra um projeto, conduza uma pesquisa profunda ou crie um artifact.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link to="/app/chat"><MessageSquare className="size-4 mr-1" /> Nova conversa</Link></Button>
          <Button variant="outline" asChild><Link to="/app/projects"><Plus className="size-4 mr-1" /> Novo projeto</Link></Button>
          <Button variant="outline" asChild><Link to="/app/research"><FlaskConical className="size-4 mr-1" /> Pesquisa profunda</Link></Button>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionHeader eyebrow="ações rápidas" title="O que você quer fazer agora?" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { i: MessageSquare, t: "Nova conversa", to: "/app/chat" },
            { i: Plus, t: "Novo projeto", to: "/app/projects" },
            { i: FlaskConical, t: "Pesquisa profunda", to: "/app/research" },
            { i: Sparkles, t: "Criar artifact", to: "/app/artifacts" },
            { i: FileText, t: "Analisar documento", to: "/app/chat" },
            { i: Network, t: "Comparar modelos", to: "/app/models" },
          ].map(({ i: Icon, t, to }) => (
            <Link key={t} to={to} className="orbe-card orbe-card-hover p-4 flex flex-col gap-3">
              <div className="size-9 rounded-lg orbe-glass flex items-center justify-center">
                <Icon className="size-4 text-[var(--orbe-blue)]" />
              </div>
              <span className="text-sm font-medium">{t}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <section className="lg:col-span-2">
          <SectionHeader eyebrow="projetos recentes" title="Continue de onde parou"
            action={<Button variant="ghost" size="sm" asChild><Link to="/app/projects">Ver todos <ArrowUpRight className="size-3.5 ml-1" /></Link></Button>} />
          <div className="grid sm:grid-cols-2 gap-3">
            {mockProjects.slice(0, 4).map((p) => (
              <Link key={p.id} to="/app/projects/$id" params={{ id: p.id }} className="orbe-card orbe-card-hover p-5 block">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
                  </div>
                  <Pill tone={p.status === "ativo" ? "success" : "muted"}>{p.status}</Pill>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{p.chatsCount} chats</span>
                  <span>{p.artifactsCount} artifacts</span>
                  <span>{p.filesCount} arquivos</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent chats */}
        <section>
          <SectionHeader eyebrow="conversas recentes" title="Últimos diálogos"
            action={<Button variant="ghost" size="sm" asChild><Link to="/app/chat">Abrir chat</Link></Button>} />
          <GlassCard className="p-0">
            <ul className="divide-y">
              {mockChats.map((c) => (
                <li key={c.id} className="p-4 hover:bg-accent/40 transition-colors">
                  <Link to="/app/chat" className="flex items-start gap-3">
                    <MessageSquare className="size-4 mt-0.5 text-[var(--orbe-blue)]" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        orbe {c.mode} · {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>
      </div>

      {/* Suggestions + Ecosystem */}
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <SectionHeader eyebrow="próximas ações sugeridas" title="A orbeAI recomenda" />
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { t: "Validar posicionamento orbeAI", d: "Conecte com fundadores ainda esta semana.", to: "/app/projects/p_1" },
              { t: "Rodar pesquisa: concorrentes globais", d: "Use orbe research com múltiplas fontes.", to: "/app/research" },
              { t: "Configurar provedor real", d: "Adicione chaves de API em modo seguro.", to: "/app/models" },
              { t: "Curar memória global", d: "Revise pendências e itens sensíveis.", to: "/app/memory" },
            ].map((s) => (
              <Link key={s.t} to={s.to as any} className="orbe-card orbe-card-hover p-4 flex items-start gap-3">
                <Bot className="size-4 mt-1 text-[var(--orbe-blue)]" />
                <div>
                  <div className="text-sm font-medium">{s.t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="ecossistema orbeOne" title="Produtos conectados"
            action={<Button variant="ghost" size="sm" asChild><Link to="/app/orbeone">Abrir <ArrowUpRight className="size-3.5 ml-1" /></Link></Button>} />
          <GlassCard className="space-y-3">
            {orbeProducts.slice(0, 5).map((p) => (
              <div key={p.slug} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-[var(--orbe-blue)] to-[var(--orbe-cyan)]" />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.tagline}</div>
                  </div>
                </div>
                <Pill tone={p.status === "ativo" ? "success" : p.status === "beta" ? "warn" : "muted"}>{p.status}</Pill>
              </div>
            ))}
          </GlassCard>
        </section>
      </div>

      {/* Model status + Usage + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">status dos modelos</div>
              <div className="font-semibold mt-1">orbeRouter</div>
            </div>
            <Network className="size-5 text-[var(--orbe-blue)]" />
          </div>
          <ul className="space-y-2">
            {mockProviders.slice(0, 5).map((p) => (
              <li key={p.slug} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><StatusDot tone={p.status === "online" ? "success" : p.status === "offline" ? "danger" : "warn"} /> {p.name}</span>
                <span className="text-xs text-muted-foreground">{p.apiKeyStatus}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">uso (7d)</div>
              <div className="font-semibold mt-1">{(totalTokens / 1000).toFixed(0)}k tokens</div>
            </div>
            <LineChart className="size-5 text-[var(--orbe-blue)]" />
          </div>
          <div className="text-3xl font-semibold">US$ {totalCost.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Custo estimado · {mockUsage.length} dias</div>
          <div className="mt-4 flex gap-1 h-12 items-end">
            {mockUsage.map((u, i) => (
              <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-[var(--orbe-blue)] to-[var(--orbe-cyan)] opacity-80"
                style={{ height: `${(u.tokens / 600000) * 100}%` }} />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">atividade</div>
              <div className="font-semibold mt-1">Última hora</div>
            </div>
            <Activity className="size-5 text-[var(--orbe-blue)]" />
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><GitBranch className="size-3.5 mt-1 text-muted-foreground" /> <span>Fallback acionado: openai → anthropic</span></li>
            <li className="flex items-start gap-2"><Sparkles className="size-3.5 mt-1 text-muted-foreground" /> <span>Artifact <b>Plano de Posicionamento orbeAI v1</b> criado</span></li>
            <li className="flex items-start gap-2"><Workflow className="size-3.5 mt-1 text-muted-foreground" /> <span>Integração Google Drive sincronizada (42 arquivos)</span></li>
            <li className="flex items-start gap-2"><FlaskConical className="size-3.5 mt-1 text-muted-foreground" /> <span>Pesquisa "concorrentes LATAM" em andamento</span></li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

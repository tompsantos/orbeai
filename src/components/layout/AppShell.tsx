import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bell, Bot, Boxes, Compass, FlaskConical, Folders, Home, MessageSquare,
  Network, Search, Settings, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import { OrbeWordmark } from "@/components/design-system/OrbeLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Cockpit", icon: Home, exact: true },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/projects", label: "Projetos", icon: Folders },
  { to: "/app/artifacts", label: "Artifacts", icon: Sparkles },
  { to: "/app/research", label: "Pesquisa", icon: FlaskConical },
  { to: "/app/agents", label: "Agentes", icon: Bot },
  { to: "/app/memory", label: "Memória", icon: Boxes },
  { to: "/app/integrations", label: "Integrações", icon: Workflow },
  { to: "/app/models", label: "Modelos", icon: Network },
  { to: "/app/orbeone", label: "Ecossistema", icon: Compass },
  { to: "/app/admin", label: "Admin", icon: ShieldCheck },
  { to: "/app/settings", label: "Ajustes", icon: Settings },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-200",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <div className="h-14 flex items-center px-4 border-b border-[var(--sidebar-border)]">
          {collapsed ? (
            <Link to="/app" className="mx-auto"><OrbeWordmark className="[&_span]:hidden" /></Link>
          ) : (
            <Link to="/app"><OrbeWordmark /></Link>
          )}
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--sidebar-accent)] text-foreground orbe-glow"
                    : "text-muted-foreground hover:bg-[var(--sidebar-accent)] hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className={cn("size-4", active && "text-[var(--orbe-blue)]")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[var(--sidebar-border)]">
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setCollapsed((v) => !v)}>
            <Zap className="size-4" />
            {!collapsed && <span className="ml-2">Compactar</span>}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-background/70 backdrop-blur-md sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6">
          <div className="md:hidden"><OrbeWordmark /></div>

          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border px-2 py-1 bg-card">workspace · orbeOne HQ</span>
            <span className="rounded-md border px-2 py-1 bg-card">projeto · orbeAI Core</span>
            <span className="rounded-md border px-2 py-1 bg-card">modo · strategist</span>
          </div>

          <div className="relative ml-auto w-full max-w-sm hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar projetos, chats, artifacts…" className="pl-9 h-9 bg-card" />
          </div>

          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-1 ring-border hover:ring-[var(--orbe-blue)] transition">
                <Avatar className="size-8"><AvatarFallback className="text-[11px] font-semibold tracking-wide bg-[var(--orbe-blue)]/15 text-[var(--orbe-blue)]">OA</AvatarFallback></Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>orbeOne Admin · owner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/app/settings">Ajustes</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/app/memory">Memória</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/app/admin">Admin cockpit</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/">Sair do app</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 min-w-0 p-4 md:p-8 animate-orbe-fade">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur flex items-center justify-around py-2">
        {[NAV[0], NAV[1], NAV[2], NAV[5], NAV[11]].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link key={item.to} to={item.to as any} className={cn("flex flex-col items-center gap-0.5 text-[10px]",
              active ? "text-[var(--orbe-blue)]" : "text-muted-foreground")}>
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

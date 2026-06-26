import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({ className, children, hoverable = true }: { className?: string; children: ReactNode; hoverable?: boolean }) {
  return (
    <div className={cn("orbe-card", hoverable && "orbe-card-hover", "p-5", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow && <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">{eyebrow}</div>}
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusDot({ tone = "neutral" }: { tone?: "success" | "warn" | "danger" | "neutral" | "info" }) {
  const map: Record<string, string> = {
    success: "bg-[var(--success)]",
    warn: "bg-[var(--warning)]",
    danger: "bg-destructive",
    info: "bg-[var(--orbe-blue)]",
    neutral: "bg-muted-foreground/50",
  };
  return <span className={cn("inline-block size-1.5 rounded-full animate-orbe-pulse", map[tone])} />;
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "blue" | "muted" | "success" | "warn" }) {
  const map: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    blue: "bg-[color-mix(in_oklch,var(--orbe-blue)_14%,transparent)] text-[var(--orbe-blue)] border border-[color-mix(in_oklch,var(--orbe-blue)_30%,transparent)]",
    muted: "bg-muted text-muted-foreground",
    success: "bg-[color-mix(in_oklch,var(--success)_14%,transparent)] text-[var(--success)]",
    warn: "bg-[color-mix(in_oklch,var(--warning)_18%,transparent)] text-[oklch(0.45_0.1_75)]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}

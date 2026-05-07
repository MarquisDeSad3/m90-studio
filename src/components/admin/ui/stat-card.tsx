import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "blue" | "violet" | "emerald" | "amber" | "muted";

const TONE: Record<
  Tone,
  { value: string; icon: string; iconBg: string }
> = {
  default: {
    value: "text-[color:var(--color-navy)]",
    icon: "text-[color:var(--color-navy)]",
    iconBg: "bg-[color:var(--color-navy)]/8",
  },
  blue: {
    value: "text-blue-700",
    icon: "text-blue-700",
    iconBg: "bg-blue-100",
  },
  violet: {
    value: "text-violet-700",
    icon: "text-violet-700",
    iconBg: "bg-violet-100",
  },
  emerald: {
    value: "text-emerald-700",
    icon: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  amber: {
    value: "text-amber-700",
    icon: "text-amber-700",
    iconBg: "bg-amber-100",
  },
  muted: {
    value: "text-[color:var(--color-navy)]/70",
    icon: "text-[color:var(--color-navy)]/55",
    iconBg: "bg-[color:var(--color-navy)]/8",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  const t = TONE[tone];
  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4 transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(1,27,83,0.18)] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-[24px] font-semibold tracking-tight tabular-nums md:text-[28px]",
              t.value,
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/45">
              {hint}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
              t.iconBg,
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", t.icon)} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  );
}

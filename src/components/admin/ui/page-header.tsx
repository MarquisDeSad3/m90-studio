import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
            · {eyebrow}
          </span>
        )}
        <h1 className="mt-2 font-display text-[clamp(28px,5vw,44px)] italic leading-tight text-[color:var(--color-navy)]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[14px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}

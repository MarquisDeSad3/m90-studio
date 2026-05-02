import { asset, cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "navy" | "cream";
  /** Add the "STUDIO" lockup next to M90. Defaults to true on the studio site. */
  withWordmark?: boolean;
};

const SRC: Record<NonNullable<Props["variant"]>, string> = {
  navy: asset("/brand/m90-navy.png"),
  cream: asset("/brand/m90-cream.png"),
};

export function Logo({ className, variant = "navy", withWordmark = true }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 leading-none select-none",
        className,
      )}
    >
      <img
        src={SRC[variant]}
        alt="M90"
        draggable={false}
        className="inline-block h-[1em] w-auto align-middle"
      />
      {withWordmark && (
        <span
          className={cn(
            "font-display tracking-[0.18em] text-[0.42em] uppercase",
            variant === "cream" && "text-[color:var(--color-cream)]",
            variant === "navy" && "text-[color:var(--color-navy)]",
          )}
        >
          Studio
        </span>
      )}
    </span>
  );
}

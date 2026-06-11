import { cn } from "@/lib/utils";

type DeltaTone = "success" | "warning" | "neutral";

const DELTA_TONE: Record<DeltaTone, string> = {
  success: "text-status-success",
  warning: "text-status-warning",
  neutral: "text-text-secondary",
};

export interface MetricDelta {
  text: string;
  tone?: DeltaTone;
  /** Optional Material Symbols icon (e.g. arrow_upward / arrow_downward). */
  icon?: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  /** Material Symbols icon in the top-right corner. */
  icon: string;
  iconClassName?: string;
  /** Full class list for the decorative blob (position, size, colour). */
  blobClassName?: string;
  delta?: MetricDelta;
  className?: string;
  valueClassName?: string;
}

/** Bento-style metric card used on the coordinator and admin dashboards. */
export default function MetricCard({
  label,
  value,
  icon,
  iconClassName = "text-primary",
  blobClassName,
  delta,
  className,
  valueClassName = "text-headline-md font-headline-md text-text-primary",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest border border-surface-border rounded-xl p-4 elevation-1 relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all",
        className
      )}
    >
      {blobClassName && <div className={cn("absolute", blobClassName)} />}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
          {label}
        </span>
        <span className={cn("material-symbols-outlined", iconClassName)}>
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <div className={valueClassName}>{value}</div>
        {delta && (
          <div
            className={cn(
              "text-label-sm font-label-sm mt-1 flex items-center gap-1",
              DELTA_TONE[delta.tone ?? "neutral"]
            )}
          >
            {delta.icon && (
              <span className="material-symbols-outlined text-[14px]">
                {delta.icon}
              </span>
            )}
            {delta.text}
          </div>
        )}
      </div>
    </div>
  );
}

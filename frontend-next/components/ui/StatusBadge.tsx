import { cn } from "@/lib/utils";

/**
 * The full status-colour vocabulary used across the site. Centralising it here
 * means the meaning of "success" / "shortlisted" / etc. is defined in one place.
 */
export type BadgeTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "assessment"
  | "shortlisted"
  | "applied"
  | "rejected"
  | "timeline"
  | "notice"
  | "event";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  error: "bg-status-error/10 text-status-error",
  info: "bg-navy-vibrant/10 text-navy-vibrant",
  neutral: "bg-surface-variant text-text-secondary",
  assessment: "bg-tertiary-fixed text-on-tertiary-fixed",
  shortlisted: "bg-secondary-fixed text-on-secondary-fixed",
  applied: "bg-surface-container-high text-on-surface-variant",
  rejected: "bg-error-container text-on-error-container",
  timeline: "bg-primary-fixed text-primary",
  notice: "bg-secondary-container text-on-secondary-container",
  event: "bg-tertiary-fixed text-on-tertiary-fixed",
};

interface StatusBadgeProps {
  tone: BadgeTone;
  /** Optional Material Symbols icon name shown before the label. */
  icon?: string;
  /** Add a subtle matching border (used by some table chips). */
  bordered?: boolean;
  /** Override / extend layout (shape, padding, casing). */
  className?: string;
  children: React.ReactNode;
}

const BORDER_CLASSES: Partial<Record<BadgeTone, string>> = {
  success: "border border-status-success/20",
  warning: "border border-status-warning/20",
  error: "border border-error/20",
};

/** A small status pill. Defaults to a rounded chip; pass `className` to adjust. */
export default function StatusBadge({
  tone,
  icon,
  bordered,
  className,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm",
        TONE_CLASSES[tone],
        bordered && BORDER_CLASSES[tone],
        className
      )}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      )}
      {children}
    </span>
  );
}

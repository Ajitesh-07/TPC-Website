import { cn } from "@/lib/utils";

interface TimelineProps {
  /** The vertical rail style (default: thin). Override for a 2px rail, etc. */
  rail?: string;
  /** Vertical spacing between items (default: space-y-6). */
  spacing?: string;
  className?: string;
  children: React.ReactNode;
}

/** Vertical timeline rail. Compose with <TimelineItem>. */
export function Timeline({
  rail = "border-l border-surface-variant",
  spacing = "space-y-6",
  className,
  children,
}: TimelineProps) {
  return (
    <div className={cn("relative ml-3", rail, spacing, className)}>
      {children}
    </div>
  );
}

interface TimelineItemProps {
  /** Full class list for the absolutely-positioned dot (size, colour, offset). */
  dotClassName: string;
  /** Left padding that clears the rail/dot (default: pl-6). */
  padding?: string;
  className?: string;
  children: React.ReactNode;
}

/** A single timeline entry: an absolute dot on the rail + content. */
export function TimelineItem({
  dotClassName,
  padding = "pl-6",
  className,
  children,
}: TimelineItemProps) {
  return (
    <div className={cn("relative", padding, className)}>
      <div className={cn("absolute", dotClassName)} />
      {children}
    </div>
  );
}

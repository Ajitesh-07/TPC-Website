import { cn } from "@/lib/utils";

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned controls (buttons, search, profile chip, …). */
  actions?: React.ReactNode;
  /** Override the outer bar (sticky / background / padding). */
  className?: string;
  /** Override the inner row (e.g. add `max-w-container-max mx-auto`). */
  innerClassName?: string;
  titleClassName?: string;
}

/** Sticky page header used across portal pages: title + subtitle + actions. */
export default function PortalHeader({
  title,
  subtitle,
  actions,
  className,
  innerClassName,
  titleClassName,
}: PortalHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md px-gutter-mobile md:px-gutter-desktop py-4",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
          innerClassName
        )}
      >
        <div>
          <h2
            className={cn(
              "text-headline-md font-headline-md text-text-primary",
              titleClassName
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
    </header>
  );
}

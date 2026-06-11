import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Small uppercase kicker above the title. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Light text for use on dark backgrounds. */
  invert?: boolean;
  /** Override the wrapper (default: centered, mb-16). */
  className?: string;
  /** Constrain the subtitle width, e.g. "max-w-2xl mx-auto". */
  subtitleClassName?: string;
}

/** Centered "eyebrow + headline + subtitle" block shared by homepage sections. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  invert = false,
  className,
  subtitleClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("text-center mb-16", className)}>
      {eyebrow && (
        <span
          className={cn(
            "text-label-md font-label-md uppercase tracking-wider block mb-3",
            invert ? "text-tertiary-fixed-dim" : "text-navy-vibrant"
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-headline-lg font-headline-lg mb-4",
          invert ? "text-on-primary" : "text-primary"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-body-lg font-body-lg",
            invert ? "text-tertiary-fixed-dim" : "text-text-secondary",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared call-to-action button. Centralises the three CTA looks used across the
 * site so they stay visually consistent:
 *  - `primary` — the navy gradient pill (`.btn-primary`)
 *  - `gold`    — the gold-leaf recruiter CTA
 *  - `glass`   — the translucent button used over dark/hero backgrounds
 *
 * Renders a `next/link` when `href` is set, otherwise a native `<button>`.
 */
export type ButtonVariant = "primary" | "gold" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn-primary text-on-primary shadow-sm hover:shadow-md hover:scale-[1.02]",
  gold: "bg-gold-leaf text-on-secondary-fixed shadow-lg hover:bg-secondary-container",
  glass: "glass-panel text-on-primary border-white/20 hover:bg-white/10",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-6 py-2 text-label-md font-label-md",
  md: "px-6 py-3.5 text-title-md font-title-md",
  lg: "px-8 py-3.5 text-title-md font-title-md",
};

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional Material Symbols icon name. */
  icon?: string;
  iconPosition?: "left" | "right";
  /** When set, renders a `next/link` instead of a `<button>`. */
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  "aria-label"?: string;
  className?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  href,
  type = "button",
  onClick,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );

  const iconEl = icon && (
    <span className="material-symbols-outlined">{icon}</span>
  );

  const content = (
    <>
      {iconPosition === "left" && iconEl}
      {children}
      {iconPosition === "right" && iconEl}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...rest}>
      {content}
    </button>
  );
}

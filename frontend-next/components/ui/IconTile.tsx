import { cn } from "@/lib/utils";

/**
 * The recurring rounded "icon chip" — a `primary-fixed` square holding a
 * primary-coloured Material Symbol. Used by the home sections (About, Downloads,
 * Portal Access, Contact) so the icon treatment stays identical everywhere.
 */
export type IconTileSize = "sm" | "md";

const SIZE_CLASSES: Record<IconTileSize, string> = {
  sm: "w-11 h-11",
  md: "w-12 h-12",
};

interface IconTileProps {
  icon: string;
  size?: IconTileSize;
  className?: string;
  iconClassName?: string;
}

export default function IconTile({
  icon,
  size = "md",
  className,
  iconClassName,
}: IconTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-primary-fixed flex items-center justify-center shrink-0",
        SIZE_CLASSES[size],
        className
      )}
    >
      <span className={cn("material-symbols-outlined text-primary", iconClassName)}>
        {icon}
      </span>
    </div>
  );
}

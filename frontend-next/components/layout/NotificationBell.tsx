"use client";

import Link from "next/link";
import { useUnreadCount } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

/**
 * Reusable header bell: links to /notifications and shows a live unread badge
 * from useUnreadCount(). Styled to match the existing portal header bells.
 */
export default function NotificationBell({ className }: NotificationBellProps) {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  const hasUnread = count > 0;

  return (
    <Link
      href="/notifications"
      aria-label={hasUnread ? `Notifications, ${count} unread` : "Notifications"}
      className={cn(
        "w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors relative",
        className
      )}
    >
      <span className="material-symbols-outlined">notifications</span>
      {hasUnread && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-error text-on-error text-label-sm font-label-sm leading-none flex items-center justify-center rounded-full ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

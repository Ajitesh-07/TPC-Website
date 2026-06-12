"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_CONFIG as MOCK_CATEGORY_CONFIG,
  type NotifCategory,
} from "@/data/notifications";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useNotificationPreferences,
  useSetNotificationPreference,
} from "@/lib/hooks";
import type {
  NotificationCategoryApi,
  NotificationItem,
} from "@/lib/api-types";

// ---------- category visual map ----------
// Reuse the existing mock CATEGORY_CONFIG (5 categories) and extend it locally
// with the API-only "system" category so all 6 backend categories render with
// the same pill/icon styling. data/notifications.ts is intentionally untouched.

type CategoryCfg = { label: string; icon: string; iconBg: string; iconText: string };

const CATEGORY_CONFIG: Record<NotificationCategoryApi, CategoryCfg> = {
  ...(MOCK_CATEGORY_CONFIG as Record<NotifCategory, CategoryCfg>),
  system: {
    label: "System",
    icon: "settings",
    iconBg: "bg-surface-variant",
    iconText: "text-on-surface-variant",
  },
};

const NOTIF_CATEGORIES: NotificationCategoryApi[] = [
  "drive",
  "status",
  "deadline",
  "schedule",
  "profile",
  "system",
];

const NOTIF_FILTERS: { key: NotificationCategoryApi | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drive", label: "Drives" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadlines" },
  { key: "schedule", label: "Schedule" },
  { key: "profile", label: "Profile" },
  { key: "system", label: "System" },
];

// ---------- local display helpers ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO → relative "10 mins ago" / "Yesterday" / "Nov 12". */
function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const PAGE_SIZE = 30;

const NotificationsPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationCategoryApi | "all">("all");

  const params = filter === "all" ? { page: 1, pageSize: PAGE_SIZE } : { page: 1, pageSize: PAGE_SIZE, category: filter };
  const notifQuery = useNotifications(params);
  const prefsQuery = useNotificationPreferences();

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const setPref = useSetNotificationPreference();

  const items = useMemo<NotificationItem[]>(() => notifQuery.data?.items ?? [], [notifQuery.data]);
  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  // Preferences keyed by category for quick lookup.
  const prefMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of prefsQuery.data ?? []) map.set(p.category, p.enabled);
    return map;
  }, [prefsQuery.data]);

  return (
    <>
      {/* Header */}
      <header className="h-20 px-gutter-mobile md:px-gutter-desktop flex items-center justify-between border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h2 className="text-headline-md font-headline-md text-text-primary hidden md:flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-error text-on-error text-label-sm font-label-sm px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h2>
          <h2 className="text-title-lg font-title-lg text-text-primary md:hidden">Notifications</h2>
          <p className="text-body-md font-body-md text-text-secondary hidden md:block">
            Stay on top of drives, deadlines, schedules, and results.
          </p>
        </div>
        <button
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-lg text-body-md font-body-md text-text-secondary hover:text-primary hover:border-primary transition-colors bg-surface-container-lowest shadow-sm disabled:opacity-50 disabled:hover:text-text-secondary disabled:hover:border-surface-border"
        >
          <span className="material-symbols-outlined text-[20px]">done_all</span>
          <span className="hidden sm:inline">
            {markAllRead.isPending ? "Marking…" : "Mark all as read"}
          </span>
        </button>
      </header>

      {/* Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-container-max mx-auto">
          {/* Feed */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {NOTIF_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-label-md font-label-md transition-colors border ${
                    filter === f.key
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container border-surface-border text-text-secondary hover:bg-surface-variant"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border overflow-hidden">
              {notifQuery.isPending ? (
                <ul className="divide-y divide-surface-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex gap-3 p-4 animate-pulse">
                      <div className="mt-0.5 w-9 h-9 rounded-full bg-surface-variant shrink-0"></div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between gap-2">
                          <div className="h-4 w-40 rounded bg-surface-variant"></div>
                          <div className="h-3 w-16 rounded bg-surface-variant"></div>
                        </div>
                        <div className="h-3 w-full rounded bg-surface-variant"></div>
                        <div className="h-3 w-2/3 rounded bg-surface-variant"></div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : notifQuery.isError ? (
                <div className="text-center py-16 px-6">
                  <span className="material-symbols-outlined text-[40px] text-status-error">error</span>
                  <p className="text-title-md font-title-md mt-2 text-status-error">
                    Couldn&apos;t load notifications
                  </p>
                  <p className="text-body-md font-body-md text-text-secondary mt-1">
                    {notifQuery.error instanceof Error ? notifQuery.error.message : "Something went wrong."}
                  </p>
                  <button
                    onClick={() => notifQuery.refetch()}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-error/10 text-status-error border border-status-error/30 text-label-md font-label-md hover:bg-status-error/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Retry
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] opacity-50">notifications_off</span>
                  <p className="text-title-md font-title-md mt-2">No notifications here</p>
                  <p className="text-body-md font-body-md mt-1">
                    You&apos;re all caught up. New alerts will show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-surface-border">
                  {items.map((n) => {
                    const cfg = CATEGORY_CONFIG[n.category];
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => handleItemClick(n)}
                          className={`w-full text-left flex gap-3 p-4 transition-colors ${
                            n.isRead ? "hover:bg-surface-container/50" : "bg-primary-fixed/15 hover:bg-primary-fixed/25"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.iconBg} ${cfg.iconText}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <h4 className={`text-label-md font-label-md text-text-primary ${n.isRead ? "" : "font-bold"}`}>
                                {n.title}
                              </h4>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-label-sm font-label-sm text-text-secondary whitespace-nowrap">
                                  {relativeTime(n.createdAt)}
                                </span>
                                {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                              </div>
                            </div>
                            {n.message && (
                              <p className="text-body-md font-body-md text-text-secondary">{n.message}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Notification Preferences */}
          <aside className="lg:col-span-4">
            <div className="bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border p-6 lg:sticky lg:top-24">
              <h3 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                Notification Preferences
              </h3>
              <p className="text-label-sm font-label-sm text-text-secondary mt-1 mb-5">
                Choose what to be notified about so your feed stays focused.
              </p>

              {prefsQuery.isPending ? (
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-variant"></div>
                        <div className="h-4 w-28 rounded bg-surface-variant"></div>
                      </div>
                      <div className="w-10 h-6 rounded-full bg-surface-variant"></div>
                    </div>
                  ))}
                </div>
              ) : prefsQuery.isError ? (
                <div className="rounded-lg border border-status-error/30 bg-status-error/10 p-4 text-center">
                  <p className="text-body-md font-body-md text-status-error">
                    Couldn&apos;t load preferences.
                  </p>
                  <button
                    onClick={() => prefsQuery.refetch()}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-error/10 text-status-error border border-status-error/30 text-label-sm font-label-sm hover:bg-status-error/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {NOTIF_CATEGORIES.map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const on = prefMap.get(cat) ?? false;
                    const pending = setPref.isPending && setPref.variables?.category === cat;
                    return (
                      <div key={cat} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.iconBg} ${cfg.iconText}`}>
                            <span className="material-symbols-outlined text-[16px]">{cfg.icon}</span>
                          </div>
                          <span className="text-body-md font-body-md text-text-primary">{cfg.label}</span>
                        </div>
                        <button
                          onClick={() => setPref.mutate({ category: cat, enabled: !on })}
                          disabled={pending}
                          role="switch"
                          aria-checked={on}
                          aria-label={`Toggle ${cfg.label}`}
                          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 disabled:opacity-60 ${
                            on ? "bg-primary" : "bg-surface-container-high"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                              on ? "translate-x-4" : ""
                            }`}
                          ></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;

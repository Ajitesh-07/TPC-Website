'use client';

import { useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Types + mock data — replace with TanStack Query hooks later.        */
/* ------------------------------------------------------------------ */

type NotifCategory = 'drive' | 'status' | 'deadline' | 'schedule' | 'profile';

const CATEGORY_CONFIG: Record<NotifCategory, { label: string; icon: string; iconBg: string; iconText: string }> = {
  drive: { label: 'Drive Alerts', icon: 'campaign', iconBg: 'bg-primary-fixed/40', iconText: 'text-primary' },
  status: { label: 'Status Updates', icon: 'fact_check', iconBg: 'bg-status-success/20', iconText: 'text-status-success' },
  deadline: { label: 'Deadlines', icon: 'timer', iconBg: 'bg-status-error/20', iconText: 'text-status-error' },
  schedule: { label: 'Schedule Pings', icon: 'event', iconBg: 'bg-navy-vibrant/15', iconText: 'text-navy-vibrant' },
  profile: { label: 'Profile Actions', icon: 'badge', iconBg: 'bg-status-warning/20', iconText: 'text-status-warning' },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as NotifCategory[];

interface NotificationItem {
  id: string;
  category: NotifCategory;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', category: 'status', title: 'Shortlist Announced', message: 'The shortlist for the DE Shaw online assessment has been published. Check the Applications tab.', time: '10 mins ago', read: false },
  { id: 'n2', category: 'deadline', title: 'Deadline Approaching', message: 'Application for Oracle India closes tonight at 11:59 PM. Ensure your resume is updated.', time: '2 hours ago', read: false },
  { id: 'n3', category: 'drive', title: 'New Drive Added', message: 'Samsung R&D Institute has opened applications for B.Tech CSE/EE 2025 batch.', time: '5 hours ago', read: false },
  { id: 'n4', category: 'schedule', title: 'PPT Rescheduled', message: 'The Pre-Placement Talk for Goldman Sachs is moved to 4:00 PM today in virtual mode.', time: 'Yesterday', read: true },
  { id: 'n5', category: 'profile', title: 'Document Verified', message: 'Your 6th semester grade sheet has been successfully verified by the CDC office.', time: 'Nov 12', read: true },
  { id: 'n6', category: 'schedule', title: 'Interview Slot Assigned', message: 'Your Atlassian technical interview is scheduled for Nov 18, 9:00 AM. Check email for the link.', time: 'Nov 11', read: true },
  { id: 'n7', category: 'status', title: 'Application Rejected', message: 'Your application for the Morgan Stanley Technology Analyst role was not shortlisted.', time: 'Nov 10', read: true },
];

const FILTERS: { key: NotifCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'drive', label: 'Drives' },
  { key: 'status', label: 'Status' },
  { key: 'deadline', label: 'Deadlines' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'profile', label: 'Profile' },
];

/* ------------------------------------------------------------------ */

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotifCategory | 'all'>('all');
  const [prefs, setPrefs] = useState<Record<NotifCategory, boolean>>({
    drive: true,
    status: true,
    deadline: true,
    schedule: true,
    profile: false,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visible = useMemo(
    () => notifications.filter((n) => filter === 'all' || n.category === filter),
    [notifications, filter]
  );

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const togglePref = (cat: NotifCategory) =>
    setPrefs((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <>
      {/* Header */}
      <header className="h-20 px-gutter-mobile md:px-gutter-desktop flex items-center justify-between border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h2 className="text-headline-md font-headline-md text-text-primary hidden md:flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-error text-on-error text-label-sm font-label-sm px-2 py-0.5 rounded-full">{unreadCount} new</span>
            )}
          </h2>
          <h2 className="text-title-lg font-title-lg text-text-primary md:hidden">Notifications</h2>
          <p className="text-body-md font-body-md text-text-secondary hidden md:block">Stay on top of drives, deadlines, schedules, and results.</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-lg text-body-md font-body-md text-text-secondary hover:text-primary hover:border-primary transition-colors bg-surface-container-lowest shadow-sm disabled:opacity-50 disabled:hover:text-text-secondary disabled:hover:border-surface-border"
        >
          <span className="material-symbols-outlined text-[20px]">done_all</span>
          <span className="hidden sm:inline">Mark all as read</span>
        </button>
      </header>

      {/* Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-container-max mx-auto">
          {/* Feed */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-label-md font-label-md transition-colors border ${
                    filter === f.key
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-surface-border text-text-secondary hover:bg-surface-variant'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border overflow-hidden">
              {visible.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] opacity-50">notifications_off</span>
                  <p className="text-title-md font-title-md mt-2">No notifications here</p>
                </div>
              ) : (
                <ul className="divide-y divide-surface-border">
                  {visible.map((n) => {
                    const cfg = CATEGORY_CONFIG[n.category];
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => markRead(n.id)}
                          className={`w-full text-left flex gap-3 p-4 transition-colors ${
                            n.read ? 'hover:bg-surface-container/50' : 'bg-primary-fixed/15 hover:bg-primary-fixed/25'
                          }`}
                        >
                          <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.iconBg} ${cfg.iconText}`}>
                            <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <h4 className={`text-label-md font-label-md text-text-primary ${n.read ? '' : 'font-bold'}`}>{n.title}</h4>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-label-sm font-label-sm text-text-secondary whitespace-nowrap">{n.time}</span>
                                {!n.read && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                              </div>
                            </div>
                            <p className="text-body-md font-body-md text-text-secondary">{n.message}</p>
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
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const on = prefs[cat];
                  return (
                    <div key={cat} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.iconBg} ${cfg.iconText}`}>
                          <span className="material-symbols-outlined text-[16px]">{cfg.icon}</span>
                        </div>
                        <span className="text-body-md font-body-md text-text-primary">{cfg.label}</span>
                      </div>
                      <button
                        onClick={() => togglePref(cat)}
                        role="switch"
                        aria-checked={on}
                        aria-label={`Toggle ${cfg.label}`}
                        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-primary' : 'bg-surface-container-high'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-4' : ''}`}></span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;

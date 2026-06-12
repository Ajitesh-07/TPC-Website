import Link from "next/link";
import PortalHeader from "@/components/ui/PortalHeader";
import MetricCard from "@/components/ui/MetricCard";
import {
  ADMIN_PROFILE,
  ADMIN_OVERVIEW_METRICS,
  ADMIN_ONGOING_EVENTS,
  ADMIN_QUICK_LINKS,
} from "@/data/admin-dashboard";

const AdminDashboard = () => {
  return (
    <>
      <PortalHeader
        title="Admin Dashboard"
        subtitle="Placement Season 2024-25 • Operations Overview"
        className="bg-surface/90 px-gutter-mobile md:px-gutter-desktop py-6 md:py-8"
        innerClassName="max-w-container-max mx-auto md:flex-row md:items-end"
        titleClassName="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg"
        actions={
          <button className="bg-surface-container-lowest border border-surface-border text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:border-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">download</span>
            Export Report
          </button>
        }
      />

      {/* Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1 max-w-container-max mx-auto w-full animate-fadeIn">
        {/* Admin information card */}
        <section className="glass-panel rounded-xl border border-surface-border elevation-1 p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-b from-primary to-navy-deep text-on-primary flex items-center justify-center text-title-lg font-title-lg font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
            {ADMIN_PROFILE.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-title-lg font-title-lg text-text-primary">
              {ADMIN_PROFILE.name}
            </h2>
            <p className="text-body-md font-body-md text-text-secondary">
              {ADMIN_PROFILE.department}
            </p>
            <p className="text-label-sm font-label-sm text-text-secondary mt-1 flex items-center gap-1 min-w-0">
              <span className="material-symbols-outlined text-[16px] shrink-0">mail</span>
              <span className="truncate">{ADMIN_PROFILE.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-[16px]">
                admin_panel_settings
              </span>
              {ADMIN_PROFILE.role}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm bg-status-success/10 text-status-success border border-status-success/20">
              <span className="material-symbols-outlined text-[16px]">
                verified
              </span>
              Active
            </span>
          </div>
        </section>

        {/* Overview metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {ADMIN_OVERVIEW_METRICS.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Placement process overview */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col">
            <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
              <h2 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-text-secondary">
                  event_note
                </span>
                Placement Process Overview
              </h2>
              <Link
                href="/calendar"
                className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors"
              >
                View Calendar
              </Link>
            </div>
            <div className="p-5">
              <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-4">
                Ongoing &amp; Upcoming This Week
              </p>
              <div className="space-y-1">
                {ADMIN_ONGOING_EVENTS.map((event, i) => (
                  <div
                    key={event.title}
                    className={`flex gap-4 relative pb-5 last:pb-0 ${
                      i === ADMIN_ONGOING_EVENTS.length - 1
                        ? ""
                        : "before:absolute before:left-[5px] before:top-5 before:bottom-0 before:w-px before:bg-surface-border"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest bg-primary"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-body-md font-body-md text-text-primary font-medium">
                        {event.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-label-sm font-label-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            calendar_today
                          </span>
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            location_on
                          </span>
                          {event.venue}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process snapshot */}
          <div className="bg-primary text-on-primary rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-title-md font-title-md font-semibold mb-1">
                Season Snapshot
              </h3>
              <p className="text-label-sm font-label-sm text-on-primary/70 mb-6">
                Placement Season 2024-25
              </p>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                  <div className="text-label-sm font-label-sm text-on-primary/70">
                    Drives Completed
                  </div>
                  <div className="text-headline-md font-headline-md">112</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                  <div className="text-label-sm font-label-sm text-on-primary/70">
                    Offers Rolled Out
                  </div>
                  <div className="text-headline-md font-headline-md">486</div>
                </div>
              </div>
              <Link
                href="/drive-catalogue"
                className="text-label-sm font-label-sm text-gold-leaf hover:underline flex items-center gap-1 mt-6"
              >
                View all drives
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <section>
          <h2 className="text-title-md font-title-md text-text-primary mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADMIN_QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-surface-container-lowest border border-surface-border rounded-xl p-5 elevation-1 hover-lift hover:border-primary transition-all flex items-start gap-4"
              >
                <div className="bg-primary/10 text-primary p-3 rounded-lg shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined">{link.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-title-md font-title-md text-text-primary">
                      {link.label}
                    </h3>
                    <span className="material-symbols-outlined text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all">
                      arrow_forward
                    </span>
                  </div>
                  <p className="text-body-md font-body-md text-text-secondary mt-1">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;

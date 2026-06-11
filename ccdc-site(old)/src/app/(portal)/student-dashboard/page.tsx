import Link from 'next/link';

/* ------------------------------------------------------------------ */
/* Mock data — replace with TanStack Query hooks once the API exists.  */
/* ------------------------------------------------------------------ */

const STUDENT = {
  name: 'Aarav Sharma',
  roll: '2101CS02',
  initials: 'AS',
  placementStatus: 'Unplaced',
  restricted: false,
  emailVerified: true,
  btechVerified: true,
  completeness: 85,
};

type AppStatus = 'Applied' | 'Assessment' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected';

const STATUS_STYLES: Record<AppStatus, string> = {
  Applied: 'bg-surface-container-high text-on-surface-variant',
  Assessment: 'bg-tertiary-fixed text-on-tertiary-fixed',
  Shortlisted: 'bg-secondary-fixed text-on-secondary-fixed',
  Interview: 'bg-primary-fixed text-on-primary-fixed',
  Selected: 'bg-status-success/15 text-status-success',
  Rejected: 'bg-error-container text-on-error-container',
};

interface Application {
  company: string;
  role: string;
  appliedOn: string;
  status: AppStatus;
}

const APPLICATIONS: Application[] = [
  { company: 'Microsoft', role: 'SDE Intern', appliedOn: 'Oct 12, 2024', status: 'Assessment' },
  { company: 'Goldman Sachs', role: 'Analyst', appliedOn: 'Oct 10, 2024', status: 'Shortlisted' },
  { company: 'Amazon', role: 'SDE 1', appliedOn: 'Oct 05, 2024', status: 'Applied' },
  { company: 'Atlassian', role: 'Product Engineer', appliedOn: 'Sep 28, 2024', status: 'Rejected' },
];

interface EligibleDrive {
  company: string;
  initials: string;
  role: string;
  ctc: string;
  deadline: string;
  closingSoon?: boolean;
  tags: string[];
}

const ELIGIBLE_DRIVES: EligibleDrive[] = [
  { company: 'Google', initials: 'G', role: 'Software Engineer (SDE I)', ctc: '₹32.5 LPA', deadline: 'Oct 24', closingSoon: true, tags: ['B.Tech', 'CSE'] },
  { company: 'Adobe', initials: 'A', role: 'Member of Technical Staff', ctc: '₹28.0 LPA', deadline: 'Oct 28', tags: ['B.Tech', 'CSE/EE'] },
  { company: 'Texas Instruments', initials: 'TI', role: 'Analog Design Intern', ctc: '₹1.2L /mo', deadline: 'Nov 02', tags: ['B.Tech', 'EE/ECE'] },
];

interface ScheduleItem {
  date: string;
  title: string;
  detail: string;
  highlight?: boolean;
}

const SCHEDULE: ScheduleItem[] = [
  { date: 'TOMORROW, 10:00 AM', title: 'Google Tech Interview', detail: 'Round 1 — Algorithms & Data Structures. Ensure stable internet.', highlight: true },
  { date: 'OCT 18, 2:00 PM', title: 'Microsoft Online Assessment', detail: 'Link will be activated 10 mins prior.' },
  { date: 'OCT 22, 9:00 AM', title: 'Pre-Placement Talk: Jaguar Land Rover', detail: 'Venue: Main Auditorium' },
];

interface Reminder {
  icon: string;
  tone: string;
  text: string;
}

const REMINDERS: Reminder[] = [
  { icon: 'timer', tone: 'text-status-warning', text: 'Microsoft OA closes in 2 days' },
  { icon: 'description', tone: 'text-primary', text: 'Update your resume for upcoming drives' },
];

/* ------------------------------------------------------------------ */

const StudentDashboard = () => {
  return (
    <>
      {/* Top App Bar / Header Area */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-surface-border px-gutter-desktop py-4 flex justify-between items-center">
        <div>
          <h2 className="text-headline-md font-headline-md text-text-primary">Overview</h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">Manage your placement journey and track progress.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors relative" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-background"></span>
          </Link>
          <div className="h-8 w-px bg-surface-border hidden sm:block"></div>
          <Link href="/my-profile" className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-label-md font-label-md text-text-primary group-hover:text-primary transition-colors">{STUDENT.name}</p>
              <p className="text-label-sm font-label-sm text-text-secondary uppercase">{STUDENT.roll}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-title-md ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              {STUDENT.initials}
            </div>
          </Link>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-gutter-desktop max-w-container-max mx-auto space-y-6">
        {/* Restriction / Clearance Banner */}
        {STUDENT.restricted ? (
          <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-error">block</span>
              <div>
                <p className="text-title-md font-title-md text-text-primary">Applications restricted</p>
                <p className="text-body-md font-body-md text-text-secondary">You are currently restricted from applying. Please contact the TPC office.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-status-success/20 bg-status-success/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-success">verified_user</span>
              <div>
                <p className="text-title-md font-title-md text-text-primary">You&apos;re all clear</p>
                <p className="text-body-md font-body-md text-text-secondary">No active restrictions — you&apos;re eligible to apply to open drives.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                <span className="material-symbols-outlined text-[14px] text-status-success">mail</span>
                {STUDENT.emailVerified ? 'Email Verified' : 'Email Pending'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                <span className="material-symbols-outlined text-[14px] text-status-success">school</span>
                {STUDENT.btechVerified ? 'B.Tech Verified' : 'B.Tech Pending'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                <span className="material-symbols-outlined text-[14px] text-text-secondary">badge</span>
                {STUDENT.placementStatus}
              </span>
            </div>
          </div>
        )}

        {/* Action Center / Bento Grid (Top Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile & Verification Widget */}
          <div className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-surface-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-title-md font-title-md text-text-primary">Profile Status</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-success/10 text-status-success text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Verified
              </span>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-display-lg font-display-lg text-primary">{STUDENT.completeness}<span className="text-headline-md font-headline-md">%</span></span>
                <span className="text-label-md font-label-md text-text-secondary pb-2">Completeness</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 mb-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${STUDENT.completeness}%` }}></div>
              </div>
              <p className="text-label-sm font-label-sm text-text-secondary">Complete missing academic records to reach 100%.</p>
            </div>
          </div>

          {/* Urgent Action Card */}
          <div className="bg-gradient-to-br from-primary to-navy-deep rounded-xl p-6 shadow-md border border-primary-container text-on-primary flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed-dim/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-start mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-warning/20 text-secondary-fixed text-label-sm font-label-sm border border-secondary-fixed/30 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Action Required
              </span>
              <span className="material-symbols-outlined text-on-primary/50 text-[32px]">event_available</span>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-label-sm font-label-sm text-on-primary-fixed-variant uppercase tracking-wider mb-1">Upcoming Interview</p>
              <h3 className="text-headline-md font-headline-md text-on-primary leading-tight mb-2">Google - Software Engineer</h3>
              <p className="text-body-md font-body-md text-on-primary/80 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Tomorrow, 10:00 AM IST
              </p>
              <button className="w-full bg-surface-container-lowest text-primary py-2 rounded-lg text-label-md font-label-md font-bold hover:bg-surface transition-colors shadow-sm">
                Join Meeting Link
              </button>
            </div>
          </div>

          {/* Quick Stats + Reminders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 soft-shadow border border-surface-border flex flex-col justify-center">
              <span className="material-symbols-outlined text-text-secondary mb-2">assignment</span>
              <span className="text-headline-lg font-headline-lg text-text-primary">12</span>
              <span className="text-label-md font-label-md text-text-secondary">Applied</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-5 soft-shadow border border-surface-border flex flex-col justify-center">
              <span className="material-symbols-outlined text-status-warning mb-2">star</span>
              <span className="text-headline-lg font-headline-lg text-text-primary">03</span>
              <span className="text-label-md font-label-md text-text-secondary">Shortlisted</span>
            </div>
            {/* Reminders */}
            <div className="col-span-2 bg-surface-container-low rounded-xl p-5 soft-shadow border border-surface-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
                <span className="text-title-md font-title-md text-text-primary">Reminders</span>
              </div>
              <ul className="space-y-2">
                {REMINDERS.map((reminder) => (
                  <li key={reminder.text} className="flex items-center gap-2 text-body-md font-body-md text-text-secondary">
                    <span className={`material-symbols-outlined text-[16px] ${reminder.tone}`}>{reminder.icon}</span>
                    {reminder.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Eligible Drives Summary */}
        <section className="bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border overflow-hidden">
          <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
            <h3 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
              Drives You&apos;re Eligible For
            </h3>
            <Link className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors flex items-center gap-1" href="/drive-catalogue">
              View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {ELIGIBLE_DRIVES.map((drive) => (
              <article key={drive.company} className="bg-surface rounded-xl border border-surface-border p-5 flex flex-col hover-lift">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-md font-bold text-navy-vibrant shrink-0">
                    {drive.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-title-md font-title-md text-text-primary truncate">{drive.company}</h4>
                    <p className="text-label-md font-label-md text-text-secondary truncate">{drive.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="block text-label-sm font-label-sm text-text-secondary">CTC / Stipend</span>
                    <span className="text-title-md font-title-md text-on-surface">{drive.ctc}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-label-sm font-label-sm text-text-secondary">Deadline</span>
                    <span className={`text-title-md font-title-md ${drive.closingSoon ? 'text-status-warning' : 'text-on-surface'}`}>{drive.deadline}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {drive.tags.map((tag) => (
                    <span key={tag} className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-label-sm font-label-sm">{tag}</span>
                  ))}
                </div>
                <Link href="/drive-catalogue" className="mt-auto bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity text-center">
                  Apply Now
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Main Layout (Table & Timeline) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Tracker Table */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border overflow-hidden flex flex-col">
            <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
              <h3 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
                Recent Applications
              </h3>
              <a className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors" href="#">View All</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-surface-container sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-5 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider font-semibold">Company</th>
                    <th className="py-3 px-5 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider font-semibold">Role</th>
                    <th className="py-3 px-5 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider font-semibold">Applied On</th>
                    <th className="py-3 px-5 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-md font-body-md">
                  {APPLICATIONS.map((app) => (
                    <tr key={app.company} className="even:bg-surface-container-lowest odd:bg-background/50 hover:bg-surface-variant/30 transition-colors border-b border-surface-variant/50 last:border-0">
                      <td className="py-3 px-5 font-semibold text-text-primary">{app.company}</td>
                      <td className="py-3 px-5 text-text-secondary">{app.role}</td>
                      <td className="py-3 px-5 text-text-secondary">{app.appliedOn}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLES[app.status]}`}>{app.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Schedule Timeline */}
          <div className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-surface-border">
            <h3 className="text-title-md font-title-md text-text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
              Upcoming Schedule
            </h3>
            <div className="relative border-l border-surface-variant ml-3 space-y-6">
              {SCHEDULE.map((item) => (
                <div key={item.title} className="relative pl-6">
                  {item.highlight ? (
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-primary rounded-full ring-4 ring-primary-fixed"></div>
                  ) : (
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-outline-variant rounded-full"></div>
                  )}
                  <p className={`text-label-sm font-label-sm mb-1 ${item.highlight ? 'text-primary font-bold' : 'text-text-secondary'}`}>{item.date}</p>
                  <div className={item.highlight ? 'bg-surface p-3 rounded-lg border border-surface-border' : ''}>
                    <h4 className="text-label-md font-label-md font-medium text-text-primary">{item.title}</h4>
                    <p className="text-body-md font-body-md text-text-secondary text-xs mt-1">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-8"></div>
    </>
  );
};

export default StudentDashboard;

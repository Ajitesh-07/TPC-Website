'use client';

import { useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Types + mock data — replace with TanStack Query hooks later.        */
/* ------------------------------------------------------------------ */

type DriveStatus = 'upcoming' | 'ongoing' | 'closed';
type ProcessType = 'Internship' | '6M + FTE' | '6M + PPO' | 'FTE';
type SortKey = 'deadline' | 'ctc' | 'company';

interface DriveDoc {
  name: string;
  meta: string;
  icon: string;
}

interface Drive {
  id: string;
  company: string;
  initials: string;
  role: string;
  processType: ProcessType;
  ctc: string;
  ctcValue: number; // for sorting
  location: string;
  deadline: string;
  daysLeft: number; // negative once passed
  status: DriveStatus;
  eligible: boolean;
  ineligibleReason?: string;
  tags: string[];
  about: string;
  eligibility: string[];
  timeline: { label: string; date: string }[];
  documents: DriveDoc[];
}

const DRIVES: Drive[] = [
  {
    id: 'google-sde',
    company: 'Google',
    initials: 'G',
    role: 'Software Engineer (SDE I)',
    processType: 'FTE',
    ctc: '₹32.5 LPA',
    ctcValue: 3250000,
    location: 'Bangalore',
    deadline: 'Oct 24, 11:59 PM',
    daysLeft: 2,
    status: 'upcoming',
    eligible: true,
    tags: ['B.Tech', 'CSE'],
    about:
      'Join Google as a Software Engineer working on large-scale distributed systems that serve billions of users. Strong fundamentals in algorithms and system design expected.',
    eligibility: ['CPI ≥ 7.5', 'B.Tech CSE / MnC', '2025 batch', 'No active backlogs'],
    timeline: [
      { label: 'Applications Close', date: 'Oct 24' },
      { label: 'Online Assessment', date: 'Oct 28' },
      { label: 'Interviews', date: 'Nov 04' },
      { label: 'Results', date: 'Nov 10' },
    ],
    documents: [
      { name: 'Job Description.pdf', meta: 'PDF · 240 KB', icon: 'description' },
      { name: 'Role Brochure.pdf', meta: 'PDF · 1.1 MB', icon: 'auto_stories' },
    ],
  },
  {
    id: 'adobe-mts',
    company: 'Adobe',
    initials: 'A',
    role: 'Member of Technical Staff',
    processType: 'FTE',
    ctc: '₹28.0 LPA',
    ctcValue: 2800000,
    location: 'Noida',
    deadline: 'Oct 28, 05:00 PM',
    daysLeft: 6,
    status: 'upcoming',
    eligible: true,
    tags: ['B.Tech', 'CSE/EE'],
    about:
      'Build the next generation of creative and document products at Adobe. Work across the stack on performant, delightful experiences.',
    eligibility: ['CPI ≥ 7.0', 'B.Tech CSE / EE', '2025 batch'],
    timeline: [
      { label: 'Applications Close', date: 'Oct 28' },
      { label: 'Online Assessment', date: 'Nov 01' },
      { label: 'Interviews', date: 'Nov 07' },
    ],
    documents: [{ name: 'Job Description.pdf', meta: 'PDF · 180 KB', icon: 'description' }],
  },
  {
    id: 'morgan-stanley',
    company: 'Morgan Stanley',
    initials: 'MS',
    role: 'Technology Analyst',
    processType: 'FTE',
    ctc: '₹28.0 LPA',
    ctcValue: 2800000,
    location: 'Mumbai',
    deadline: 'Oct 26, 05:00 PM',
    daysLeft: 4,
    status: 'upcoming',
    eligible: false,
    ineligibleReason: 'Your CPI is below the minimum requirement for this company (Required: 8.5).',
    tags: ['B.Tech', 'All Circuital'],
    about:
      'Work at the intersection of finance and technology, building platforms that power global markets.',
    eligibility: ['CPI ≥ 8.5', 'B.Tech (Circuital branches)', '2025 batch', 'No active backlogs'],
    timeline: [
      { label: 'Applications Close', date: 'Oct 26' },
      { label: 'Online Assessment', date: 'Oct 30' },
      { label: 'Interviews', date: 'Nov 05' },
    ],
    documents: [{ name: 'Job Description.pdf', meta: 'PDF · 210 KB', icon: 'description' }],
  },
  {
    id: 'ti-intern',
    company: 'Texas Instruments',
    initials: 'TI',
    role: 'Analog Design Intern',
    processType: 'Internship',
    ctc: '₹1.2L / month',
    ctcValue: 144000,
    location: 'Bangalore',
    deadline: 'Nov 02, 11:59 PM',
    daysLeft: 11,
    status: 'upcoming',
    eligible: true,
    tags: ['B.Tech', 'EE/ECE'],
    about:
      'A 6-month internship working on analog and mixed-signal IC design with potential for a pre-placement offer.',
    eligibility: ['CPI ≥ 7.5', 'B.Tech EE / ECE', '2026 batch'],
    timeline: [
      { label: 'Applications Close', date: 'Nov 02' },
      { label: 'Online Assessment', date: 'Nov 06' },
      { label: 'Interviews', date: 'Nov 12' },
    ],
    documents: [{ name: 'Internship JD.pdf', meta: 'PDF · 160 KB', icon: 'description' }],
  },
  {
    id: 'goldman-analyst',
    company: 'Goldman Sachs',
    initials: 'GS',
    role: 'Analyst — Engineering',
    processType: '6M + PPO',
    ctc: '₹26.0 LPA',
    ctcValue: 2600000,
    location: 'Bangalore',
    deadline: 'Closed — In Process',
    daysLeft: 0,
    status: 'ongoing',
    eligible: true,
    tags: ['B.Tech', 'CSE/IT'],
    about:
      'Engineering at Goldman Sachs builds massively scalable software and systems for the firm and its clients.',
    eligibility: ['CPI ≥ 7.5', 'B.Tech CSE / IT', '2025 batch'],
    timeline: [
      { label: 'Online Assessment', date: 'Oct 12 ✓' },
      { label: 'Interviews', date: 'Oct 20 (ongoing)' },
      { label: 'Results', date: 'Oct 28' },
    ],
    documents: [
      { name: 'Job Description.pdf', meta: 'PDF · 220 KB', icon: 'description' },
      { name: 'Interview Instructions.pdf', meta: 'PDF · 95 KB', icon: 'rule' },
    ],
  },
  {
    id: 'qualcomm-intern',
    company: 'Qualcomm',
    initials: 'Q',
    role: 'Hardware Engineering Intern',
    processType: 'Internship',
    ctc: '₹1.0L / month',
    ctcValue: 100000,
    location: 'Hyderabad',
    deadline: 'Closed — In Process',
    daysLeft: 0,
    status: 'ongoing',
    eligible: false,
    ineligibleReason: 'Your branch is not included in the company eligibility list.',
    tags: ['B.Tech', 'ECE only'],
    about: 'Work on chipsets that power the connected world, from modems to compute.',
    eligibility: ['CPI ≥ 7.0', 'B.Tech ECE', '2026 batch'],
    timeline: [
      { label: 'Online Assessment', date: 'Oct 10 ✓' },
      { label: 'Interviews', date: 'Oct 18 (ongoing)' },
    ],
    documents: [{ name: 'Internship JD.pdf', meta: 'PDF · 140 KB', icon: 'description' }],
  },
  {
    id: 'amazon-sde',
    company: 'Amazon',
    initials: 'AZ',
    role: 'SDE I',
    processType: 'FTE',
    ctc: '₹30.0 LPA',
    ctcValue: 3000000,
    location: 'Bangalore',
    deadline: 'Closed Oct 05',
    daysLeft: -10,
    status: 'closed',
    eligible: true,
    tags: ['B.Tech', 'CSE'],
    about: 'Build and scale services used by millions of Amazon customers worldwide.',
    eligibility: ['CPI ≥ 7.0', 'B.Tech CSE', '2025 batch'],
    timeline: [
      { label: 'Applications Closed', date: 'Oct 05' },
      { label: 'Results Declared', date: 'Oct 15' },
    ],
    documents: [{ name: 'Job Description.pdf', meta: 'PDF · 200 KB', icon: 'description' }],
  },
];

const TABS: { key: DriveStatus; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'closed', label: 'Closed' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'deadline', label: 'Deadline (Soonest)' },
  { key: 'ctc', label: 'CTC (Highest)' },
  { key: 'company', label: 'Company (A–Z)' },
];

// Closing-soon deadline highlight.
const deadlineTone = (daysLeft: number) => {
  if (daysLeft <= 0) return 'text-text-secondary';
  if (daysLeft <= 3) return 'text-status-error';
  if (daysLeft <= 7) return 'text-status-warning';
  return 'text-on-surface';
};

/* ------------------------------------------------------------------ */

const DriveCatalogue = () => {
  const [activeTab, setActiveTab] = useState<DriveStatus>('upcoming');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('deadline');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Drive | null>(null);

  const visibleDrives = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DRIVES.filter((d) => d.status === activeTab)
      .filter((d) => (eligibleOnly ? d.eligible : true))
      .filter((d) => !q || d.company.toLowerCase().includes(q) || d.role.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === 'company') return a.company.localeCompare(b.company);
        if (sortBy === 'ctc') return b.ctcValue - a.ctcValue;
        return a.daysLeft - b.daysLeft;
      });
  }, [activeTab, query, sortBy, eligibleOnly]);

  return (
    <>
      {/* Header */}
      <header className="bg-surface sticky top-0 z-30 border-b border-surface-border px-gutter-desktop py-6">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-text-primary">Drive Catalogue</h2>
            <p className="text-body-md font-body-md text-text-secondary mt-1">Explore and apply for upcoming placement and internship opportunities.</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                placeholder="Search companies or roles..."
                type="text"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`p-2 border rounded-xl transition-colors flex items-center justify-center ${
                  eligibleOnly || showFilter ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container border-surface-border text-on-surface-variant hover:bg-surface-variant'
                }`}
                aria-label="Filter"
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-border rounded-xl elevation-2 p-4 z-40">
                  <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-3">Filters</p>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-body-md font-body-md text-text-primary">Eligible only</span>
                    <input
                      type="checkbox"
                      checked={eligibleOnly}
                      onChange={(e) => setEligibleOnly(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="flex-1 px-gutter-desktop py-8 max-w-container-max mx-auto w-full">
        {/* Controls (Tabs & Sort) */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="bg-surface-container-low p-1 rounded-xl inline-flex w-full sm:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-title-md font-title-md transition-all ${
                  activeTab === tab.key ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-body-md font-body-md text-text-secondary w-full sm:w-auto justify-end">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent border-none text-primary font-medium focus:ring-0 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Drives Grid */}
        {visibleDrives.length === 0 ? (
          <div className="text-center py-24 text-text-secondary">
            <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
            <p className="text-title-md font-title-md">No drives match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleDrives.map((drive) => (
              <article
                key={drive.id}
                className={`bg-surface rounded-xl border border-surface-border soft-shadow p-6 flex flex-col relative overflow-hidden ${
                  drive.eligible ? 'hover-lift hover:border-navy-vibrant' : 'opacity-90'
                }`}
              >
                {drive.eligible && <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed-dim opacity-10 rounded-bl-full -z-10"></div>}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                      {drive.initials}
                    </div>
                    <div>
                      <h3 className="text-title-lg font-title-lg text-text-primary">{drive.company}</h3>
                      <p className="text-label-md font-label-md text-text-secondary">{drive.role}</p>
                    </div>
                  </div>
                  {drive.eligible ? (
                    <span className="inline-flex items-center gap-1 bg-status-success/10 text-status-success px-2 py-1 rounded-md text-label-sm font-label-sm shrink-0">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-status-error/10 text-status-error px-2 py-1 rounded-md text-label-sm font-label-sm shrink-0">
                      <span className="material-symbols-outlined text-[14px]">cancel</span>
                      Ineligible
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">CTC / Stipend</span>
                    <span className="text-title-md font-title-md text-on-surface">{drive.ctc}</span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">Deadline</span>
                    <span className={`text-title-md font-title-md ${deadlineTone(drive.daysLeft)}`}>{drive.deadline}</span>
                  </div>
                </div>

                {/* Deadline highlight + process type */}
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                  <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-md text-label-sm font-label-sm">{drive.processType}</span>
                  {drive.tags.map((tag) => (
                    <span key={tag} className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-label-sm font-label-sm">{tag}</span>
                  ))}
                  {drive.status === 'upcoming' && drive.daysLeft > 0 && drive.daysLeft <= 3 && (
                    <span className="ml-auto inline-flex items-center gap-1 bg-status-error/10 text-status-error px-2 py-1 rounded-md text-label-sm font-label-sm font-bold">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      Closes in {drive.daysLeft}d
                    </span>
                  )}
                </div>

                {/* Ineligibility Display Block */}
                {!drive.eligible && drive.ineligibleReason && (
                  <div className="bg-error-container text-on-error-container p-2 rounded-lg text-label-md font-label-md mb-4 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                    <span>{drive.ineligibleReason}</span>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-border">
                  <button
                    onClick={() => setSelected(drive)}
                    className="text-label-md font-label-md text-primary hover:text-navy-vibrant flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Details
                  </button>
                  {drive.status === 'closed' ? (
                    <span className="bg-surface-container-highest text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md">Closed</span>
                  ) : !drive.eligible ? (
                    <button disabled className="bg-surface-container-highest text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md cursor-not-allowed">
                      Apply Locked
                    </button>
                  ) : drive.status === 'ongoing' ? (
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-lg text-label-md font-label-md">In Process</span>
                  ) : (
                    <button className="bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity">
                      Apply Now
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}></div>
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar elevation-2">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-surface-border px-6 py-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                  {selected.initials}
                </div>
                <div>
                  <h3 className="text-title-lg font-title-lg text-text-primary">{selected.company}</h3>
                  <p className="text-label-md font-label-md text-text-secondary">{selected.role}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary transition-colors" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Process', value: selected.processType },
                  { label: 'CTC / Stipend', value: selected.ctc },
                  { label: 'Location', value: selected.location },
                  { label: 'Deadline', value: selected.deadline, tone: deadlineTone(selected.daysLeft) },
                ].map((fact) => (
                  <div key={fact.label} className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">{fact.label}</span>
                    <span className={`text-label-md font-label-md font-medium ${fact.tone ?? 'text-on-surface'}`}>{fact.value}</span>
                  </div>
                ))}
              </div>

              {/* About */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">About the Role</h4>
                <p className="text-body-md font-body-md text-text-secondary">{selected.about}</p>
              </div>

              {/* Eligibility */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">Eligibility Criteria</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.eligibility.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                      <span className="material-symbols-outlined text-[16px] text-status-success">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-3">Process Timeline</h4>
                <div className="relative border-l border-surface-variant ml-2 space-y-4">
                  {selected.timeline.map((step) => (
                    <div key={step.label} className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-primary rounded-full"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-md font-body-md text-text-primary">{step.label}</span>
                        <span className="text-label-md font-label-md text-text-secondary">{step.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">Documents</h4>
                <div className="space-y-2">
                  {selected.documents.map((doc) => (
                    <a
                      key={doc.name}
                      href="#"
                      className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-border hover:border-primary transition-colors group"
                    >
                      <span className="material-symbols-outlined text-primary">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md font-label-md text-text-primary truncate">{doc.name}</p>
                        <p className="text-label-sm font-label-sm text-text-secondary">{doc.meta}</p>
                      </div>
                      <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">download</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Ineligibility block / Apply */}
              {!selected.eligible && selected.ineligibleReason && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-md font-body-md flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">info</span>
                  <span>{selected.ineligibleReason}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-surface-container-lowest/95 backdrop-blur-sm border-t border-surface-border px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-variant transition-colors">
                Close
              </button>
              {selected.status === 'closed' ? (
                <span className="px-4 py-2 rounded-lg bg-surface-container-highest text-text-secondary text-label-md font-label-md">Drive Closed</span>
              ) : !selected.eligible ? (
                <button disabled className="px-4 py-2 rounded-lg bg-surface-container-highest text-text-secondary text-label-md font-label-md cursor-not-allowed">
                  Apply Locked
                </button>
              ) : selected.status === 'ongoing' ? (
                <span className="px-4 py-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-label-md font-label-md">In Process</span>
              ) : (
                <button className="bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary px-5 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity">
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriveCatalogue;

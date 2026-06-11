/* ------------------------------------------------------------------ */
/* Mock data — replace with TanStack Query hooks once the API exists.  */
/* ------------------------------------------------------------------ */

const STUDENT = {
  name: 'Aarav Sharma',
  roll: '2101CS02',
  initials: 'AS',
  officialEmail: 'aarav_2101cs02@iitp.ac.in',
};

interface LockedField {
  label: string;
  value: string;
  icon?: string;
  tone?: string;
}

// Admin-controlled, read-only. Sourced from the verified master dataset.
const LOCKED_FIELDS: LockedField[] = [
  { label: 'Official Email', value: 'aarav_2101cs02@iitp.ac.in' },
  { label: 'Program', value: 'B.Tech' },
  { label: 'Branch', value: 'Computer Science & Engineering' },
  { label: 'Batch', value: '2021 – 2025' },
  { label: 'CPI (Current)', value: '8.92' },
  { label: 'Backlog Status', value: 'No Active Backlogs', icon: 'check_circle', tone: 'text-status-success' },
  { label: 'Placement Status', value: 'Unplaced' },
  { label: 'Placement Credits', value: '100', icon: 'toll', tone: 'text-primary' },
  { label: 'B.Tech Status', value: 'Verified', icon: 'verified', tone: 'text-status-success' },
];

type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

const REQUEST_STYLES: Record<RequestStatus, string> = {
  Pending: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  Approved: 'bg-status-success/10 text-status-success border-status-success/20',
  Rejected: 'bg-error-container text-on-error-container border-error/20',
};

interface CorrectionRequest {
  field: string;
  detail: string;
  status: RequestStatus;
  submitted: string;
}

const CORRECTION_REQUESTS: CorrectionRequest[] = [
  { field: 'CPI Update Request', detail: 'Requested change from 8.85 to 8.92 based on sem 5 results.', status: 'Pending', submitted: '2 days ago' },
  { field: 'Branch Correction', detail: 'Corrected branch label to Computer Science & Engineering.', status: 'Approved', submitted: 'Sep 20, 2024' },
];

interface EditableField {
  id: string;
  label: string;
  type: string;
  defaultValue?: string;
  placeholder?: string;
}

const CONTACT_FIELDS: EditableField[] = [
  { id: 'phone', label: 'Phone Number', type: 'tel', defaultValue: '+91 98765 43210' },
  { id: 'alt-email', label: 'Alternate Email', type: 'email', defaultValue: 'aarav.sharma@example.com' },
  { id: 'location', label: 'Preferred Location', type: 'text', defaultValue: 'Bangalore, Hyderabad, Remote' },
];

const LINK_FIELDS: EditableField[] = [
  { id: 'linkedin', label: 'LinkedIn Profile URL', type: 'url', defaultValue: 'https://linkedin.com/in/aaravsharma' },
  { id: 'github', label: 'GitHub / Portfolio URL', type: 'url', defaultValue: 'https://github.com/aaravsharma' },
];

const inputClass =
  'w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all';

/* ------------------------------------------------------------------ */

const MyProfile = () => {
  return (
    <>
      {/* Header */}
      <header className="bg-surface sticky top-0 z-30 px-gutter-desktop py-6 border-b border-surface-border/50 bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-container-max mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-headline-md font-headline-md text-text-primary hidden md:block">My Profile</h1>
            <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-text-primary md:hidden">My Profile</h1>
            <p className="text-body-md font-body-md text-text-secondary mt-1">Manage your academic and professional identity.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-border">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              <span className="text-label-sm font-label-sm text-text-secondary">Profile Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full space-y-6 md:space-y-8">
        {/* Top Grid: Identity & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Col: Locked Identity & Academic Card */}
          <div className="lg:col-span-2 glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row relative">
            <div className="absolute top-4 right-4 bg-surface-container-low px-2 py-1 rounded border border-surface-border flex items-center gap-1 z-10">
              <span className="material-symbols-outlined text-[14px] text-text-secondary">lock</span>
              <span className="text-label-sm font-label-sm text-text-secondary">Verified by Admin</span>
            </div>
            <div className="w-full md:w-1/3 bg-surface-container-low p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-surface-border">
              <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-display-lg font-display-lg mb-4 shadow-sm">
                {STUDENT.initials}
              </div>
              <h2 className="text-title-md font-title-md text-text-primary text-center">{STUDENT.name}</h2>
              <p className="text-body-md font-body-md text-text-secondary text-center mt-1">{STUDENT.roll}</p>
            </div>
            <div className="w-full md:w-2/3 p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 content-start">
              {LOCKED_FIELDS.map((field) => (
                <div key={field.label}>
                  <label className="text-label-sm font-label-sm text-text-secondary block mb-1 uppercase tracking-wider">{field.label}</label>
                  <div className={`text-body-md font-body-md font-medium flex items-center gap-1.5 ${field.tone ?? 'text-text-primary'}`}>
                    {field.icon && <span className="material-symbols-outlined text-[16px]">{field.icon}</span>}
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Data Correction Tracker */}
          <div className="glass-panel rounded-xl shadow-sm p-6 flex flex-col border border-surface-border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-title-md font-title-md text-text-primary">Data Requests</h3>
                <p className="text-label-sm font-label-sm text-text-secondary">Correction requests for locked fields</p>
              </div>
              <button className="text-primary hover:text-navy-vibrant text-label-sm font-label-sm transition-colors flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[16px]">add</span> New Request
              </button>
            </div>
            <div className="space-y-4 flex-1">
              {CORRECTION_REQUESTS.map((request) => (
                <div key={request.field} className="p-3 bg-surface-container-low rounded-lg border border-surface-border">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-label-md font-label-md text-text-primary font-medium">{request.field}</span>
                    <span className={`px-2 py-0.5 rounded text-label-sm font-label-sm border whitespace-nowrap ${REQUEST_STYLES[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-label-sm font-label-sm text-text-secondary line-clamp-2">{request.detail}</p>
                  <div className="mt-2 text-label-sm font-label-sm text-text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> Submitted {request.submitted}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid: Editable Sections */}
        <div className="glass-panel rounded-xl shadow-sm border border-surface-border overflow-hidden">
          <div className="border-b border-surface-border bg-surface-container-lowest px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-title-md font-title-md text-text-primary">Professional Details</h3>
              <p className="text-label-sm font-label-sm text-text-secondary">Editable fields — used to prefill your applications</p>
            </div>
            <button className="bg-gradient-to-b from-primary to-navy-deep text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:shadow-md transition-all shrink-0">
              Save Changes
            </button>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info Form */}
            <div className="space-y-5">
              <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider border-b border-surface-border pb-2 mb-4">Contact Information</h4>
              {CONTACT_FIELDS.map((field) => (
                <div key={field.id}>
                  <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor={field.id}>{field.label}</label>
                  <input id={field.id} className={inputClass} type={field.type} defaultValue={field.defaultValue} placeholder={field.placeholder} />
                </div>
              ))}
            </div>

            {/* Skills & Links Form */}
            <div className="space-y-5">
              <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider border-b border-surface-border pb-2 mb-4">Skills &amp; Links</h4>
              <div>
                <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="skills">Core Technical Skills (Comma separated)</label>
                <textarea id="skills" className={`${inputClass} resize-none`} rows={2} defaultValue="C++, Python, React, Machine Learning, Data Structures"></textarea>
              </div>
              {LINK_FIELDS.map((field) => (
                <div key={field.id}>
                  <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor={field.id}>{field.label}</label>
                  <input id={field.id} className={inputClass} type={field.type} defaultValue={field.defaultValue} placeholder={field.placeholder} />
                </div>
              ))}
              {/* Resume — PDF upload or link */}
              <div>
                <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="resume">Resume (PDF or Link)</label>
                <div className="flex gap-2">
                  <input id="resume" className={inputClass} type="url" placeholder="Paste a Drive / Dropbox link…" />
                  <button className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-label-md font-label-md text-text-primary hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    <span className="hidden sm:inline">Upload PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;

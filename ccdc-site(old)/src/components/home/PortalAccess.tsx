import Link from 'next/link';

// Staff roles. Company login is planned for a later phase per the brief.
// NOTE: a dedicated /admin-dashboard route does not exist yet — Admin temporarily
// points at the super-admin dashboard until the admin view is built.
const STAFF_ROLES = [
  { label: 'Coordinator', icon: 'badge', to: '/coordinator-dashboard' },
  { label: 'Admin', icon: 'admin_panel_settings', to: '/super-admin-dashboard' },
  { label: 'Super Admin', icon: 'shield_person', to: '/super-admin-dashboard' },
];

const PortalAccess = () => {
  return (
    <section id="portal-access" className="py-24 px-gutter-desktop hero-gradient">
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16">
          <span className="text-label-md font-label-md text-tertiary-fixed-dim uppercase tracking-wider block mb-3">
            Portal Access
          </span>
          <h2 className="text-headline-lg font-headline-lg text-on-primary mb-4">Sign in to continue</h2>
          <p className="text-body-lg font-body-lg text-tertiary-fixed-dim max-w-2xl mx-auto">
            Students sign in with their official college email. Staff members can use their
            assigned role-based access.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          {/* Primary: Student login via college email / Microsoft SSO */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 md:p-10 elevation-2 flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <h3 className="text-title-lg font-title-lg text-primary mb-2">Student Login</h3>
            <p className="text-body-md font-body-md text-text-secondary mb-6">
              Access your dashboard, eligible drives, applications, and placement calendar.
              Sign in is restricted to verified IIT Patna college email IDs.
            </p>
            <Link
              href="/student-dashboard"
              className="btn-primary text-on-primary px-6 py-3.5 rounded-lg text-title-md font-title-md flex items-center justify-center gap-2 hover:shadow-md transition-shadow duration-200 mb-3"
            >
              <span className="material-symbols-outlined">mail</span>
              Continue with College Email
            </Link>
            <p className="text-label-sm font-label-sm text-text-secondary text-center uppercase tracking-wider">
              Secured by Microsoft OAuth / Institute SSO
            </p>
          </div>

          {/* Staff role logins */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {STAFF_ROLES.map((role) => (
              <Link
                key={role.label}
                href={role.to}
                className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:bg-white/90 transition-colors duration-200 group"
              >
                <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{role.icon}</span>
                </div>
                <div className="flex-grow">
                  <div className="text-title-md font-title-md text-primary">{role.label}</div>
                  <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
                    Staff access
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortalAccess;

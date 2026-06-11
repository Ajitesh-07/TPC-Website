import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { STAFF_ROLES } from "@/data/navigation";

const PortalAccess = () => {
  return (
    <section id="portal-access" className="py-24 px-gutter-desktop hero-gradient">
      <div className="max-w-container-max mx-auto">
        <SectionHeading
          invert
          eyebrow="Portal Access"
          title="Sign in to continue"
          subtitle="Students sign in with their official college email. Staff members can use their assigned role-based access."
          subtitleClassName="max-w-2xl mx-auto"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          {/* Primary: student login */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 md:p-10 elevation-2 flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary">
                school
              </span>
            </div>
            <h3 className="text-title-lg font-title-lg text-primary mb-2">
              Student Login
            </h3>
            <p className="text-body-md font-body-md text-text-secondary mb-6">
              Access your dashboard, eligible drives, applications, and placement
              calendar. Sign in is restricted to verified IIT Patna college email
              IDs.
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
                href={role.href}
                className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:bg-white/90 transition-colors duration-200 group"
              >
                <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">
                    {role.icon}
                  </span>
                </div>
                <div className="grow">
                  <div className="text-title-md font-title-md text-primary">
                    {role.label}
                  </div>
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

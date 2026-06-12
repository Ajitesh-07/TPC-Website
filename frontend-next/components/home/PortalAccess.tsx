"use client";

import { useRouter } from "next/navigation";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import IconTile from "@/components/ui/IconTile";
import { STAFF_ROLES } from "@/data/navigation";
import { useRole } from "@/components/providers/RoleProvider";
import { DEFAULT_DASHBOARD, type Role } from "@/lib/roles";

const PortalAccess = () => {
  const { setRole } = useRole();
  const router = useRouter();

  // Mock "login": set the role cookie, then land on that role's dashboard.
  const enterAs = (role: Role) => {
    setRole(role);
    router.push(DEFAULT_DASHBOARD[role]);
  };

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
            <IconTile icon="school" className="mb-5" />
            <h3 className="text-title-lg font-title-lg text-primary mb-2">
              Student Login
            </h3>
            <p className="text-body-md font-body-md text-text-secondary mb-6">
              Access your dashboard, eligible drives, applications, and placement
              calendar. Sign in is restricted to verified IIT Patna college email
              IDs.
            </p>
            <Button
              onClick={() => enterAs("student")}
              icon="mail"
              className="w-full mb-3"
            >
              Continue with College Email
            </Button>
            <p className="text-label-sm font-label-sm text-text-secondary text-center uppercase tracking-wider">
              Secured by Microsoft OAuth / Institute SSO
            </p>
          </div>

          {/* Recruiter + staff role logins */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Company recruiter login */}
            <button
              type="button"
              onClick={() => enterAs("company")}
              className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 hover:bg-white/90 transition-colors duration-200 group text-left elevation-1"
            >
              <IconTile icon="business_center" size="sm" />
              <div className="grow">
                <div className="text-title-md font-title-md text-primary">
                  Recruiter
                </div>
                <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
                  Company access
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>

            {STAFF_ROLES.map((staff) => (
              <button
                key={staff.label}
                type="button"
                onClick={() => enterAs(staff.role)}
                className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:bg-white/90 transition-colors duration-200 group text-left"
              >
                <IconTile icon={staff.icon} size="sm" />
                <div className="grow">
                  <div className="text-title-md font-title-md text-primary">
                    {staff.label}
                  </div>
                  <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
                    Staff access
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortalAccess;

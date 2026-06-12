"use client";

import { useState, type FormEvent } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import IconTile from "@/components/ui/IconTile";
import { STAFF_ROLES } from "@/data/navigation";
import { API_URL } from "@/lib/api";
import { requestRecruiterLink } from "@/lib/hooks";

/**
 * Sign-in entry points. Institute users (students + staff) authenticate with
 * Microsoft SSO — their role comes from the account, so every institute button
 * leads to the same flow. Recruiters are external: they get a one-time email
 * sign-in link instead.
 */
const PortalAccess = () => {
  const signIn = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  // Recruiter magic-link state
  const [email, setEmail] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const requestLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLinkState("sending");
    try {
      await requestRecruiterLink(email.trim());
      setLinkState("sent");
    } catch {
      setLinkState("error");
    }
  };

  return (
    <section id="portal-access" className="py-24 px-gutter-desktop hero-gradient">
      <div className="max-w-container-max mx-auto">
        <SectionHeading
          invert
          eyebrow="Portal Access"
          title="Sign in to continue"
          subtitle="Students and staff sign in with their official college email. Company recruiters receive a one-time sign-in link."
          subtitleClassName="max-w-2xl mx-auto"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          {/* Primary: institute login (students + staff, role from account) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 md:p-10 elevation-2 flex flex-col">
            <IconTile icon="school" className="mb-5" />
            <h3 className="text-title-lg font-title-lg text-primary mb-2">
              Institute Login
            </h3>
            <p className="text-body-md font-body-md text-text-secondary mb-6">
              Students, coordinators, and administrators sign in with their IIT
              Patna Microsoft account. Your dashboard is chosen automatically
              from your role.
            </p>
            <Button onClick={signIn} icon="mail" className="w-full mb-3">
              Continue with College Email
            </Button>
            <p className="text-label-sm font-label-sm text-text-secondary text-center uppercase tracking-wider">
              Secured by Microsoft OAuth / Institute SSO
            </p>

            {/* Staff hint chips (same SSO — role comes from the account) */}
            <div className="mt-6 pt-5 border-t border-surface-border flex flex-wrap gap-2 justify-center">
              {STAFF_ROLES.map((staff) => (
                <span
                  key={staff.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant text-label-sm font-label-sm text-text-secondary"
                >
                  <span className="material-symbols-outlined text-[16px]">{staff.icon}</span>
                  {staff.label}
                </span>
              ))}
            </div>
          </div>

          {/* Recruiter: email magic link */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-8 elevation-2 flex flex-col">
            <IconTile icon="business_center" className="mb-5" />
            <h3 className="text-title-lg font-title-lg text-primary mb-2">
              Recruiter Sign-in
            </h3>
            <p className="text-body-md font-body-md text-text-secondary mb-6">
              Enter your registered work email and we&apos;ll send you a secure
              one-time sign-in link.
            </p>

            {linkState === "sent" ? (
              <div className="rounded-lg bg-status-success/10 text-status-success p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  mark_email_read
                </span>
                <p className="text-body-md font-body-md">
                  If that address is registered with the TPC, a sign-in link is
                  on its way. It expires in 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={requestLink} className="flex flex-col gap-3">
                <label htmlFor="recruiter-email" className="sr-only">
                  Work email
                </label>
                <input
                  id="recruiter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <Button
                  type="submit"
                  icon="forward_to_inbox"
                  className="w-full"
                >
                  {linkState === "sending" ? "Sending…" : "Email me a sign-in link"}
                </Button>
                {linkState === "error" && (
                  <p className="text-label-sm font-label-sm text-status-error">
                    Something went wrong — please try again in a minute.
                  </p>
                )}
              </form>
            )}

            <p className="mt-auto pt-5 text-label-sm font-label-sm text-text-secondary">
              Recruiter accounts are provisioned by the placement cell. Contact{" "}
              <a href="mailto:tpc@iitp.ac.in" className="text-gold-leaf hover:underline">
                tpc@iitp.ac.in
              </a>{" "}
              to register your company.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortalAccess;

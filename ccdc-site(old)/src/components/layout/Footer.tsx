import Link from 'next/link';

const QUICK_LINKS = [
  { label: 'About TPC', href: '/#about' },
  { label: 'Placement Stats', href: '/#stats' },
  { label: 'Past Recruiters', href: '/#recruiters' },
  { label: 'Announcements', href: '/#announcements' },
];

const RESOURCES = [
  { label: 'Downloads (INF / JNF)', href: '/#downloads' },
  { label: 'Placement Brochure', href: '/#downloads' },
  { label: 'Placement Policy', href: '/#downloads' },
  { label: 'Student Portal', href: '/#portal-access' },
];

const Footer = () => {
  return (
    <footer className="w-full bg-navy-deep mt-auto">
      <div className="max-w-container-max mx-auto px-gutter-desktop py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Brand */}
        <div className="md:col-span-5">
          <div className="text-title-lg font-title-lg text-on-primary mb-3">
            IIT Patna Career Development Centre
          </div>
          <p className="text-body-md font-body-md text-tertiary-fixed-dim max-w-sm mb-6">
            Connecting world-class talent with global industry leaders. The official
            Training &amp; Placement Cell portal of IIT Patna.
          </p>
          <div className="flex items-center gap-3">
            {['mail', 'call', 'public'].map((icon) => (
              <a
                key={icon}
                href="/#contact"
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-tertiary-fixed-dim hover:bg-white/20 hover:text-on-primary transition-colors"
                aria-label={icon}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-3">
          <h3 className="text-label-md font-label-md text-on-primary uppercase tracking-wider mb-4">
            Quick Links
          </h3>
          <ul className="flex flex-col gap-3">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <a className="text-body-md font-body-md text-tertiary-fixed-dim hover:text-on-primary transition-colors" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="md:col-span-4">
          <h3 className="text-label-md font-label-md text-on-primary uppercase tracking-wider mb-4">
            Resources
          </h3>
          <ul className="flex flex-col gap-3">
            {RESOURCES.map((link) => (
              <li key={link.label}>
                <a className="text-body-md font-body-md text-tertiary-fixed-dim hover:text-on-primary transition-colors" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="max-w-container-max mx-auto px-gutter-desktop py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-body-md font-body-md text-tertiary-fixed-dim">
            © 2026 Indian Institute of Technology Patna. All Rights Reserved.
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="#" className="text-label-sm font-label-sm text-tertiary-fixed-dim hover:text-on-primary transition-colors uppercase tracking-wider">
              Privacy Policy
            </Link>
            <Link href="#" className="text-label-sm font-label-sm text-tertiary-fixed-dim hover:text-on-primary transition-colors uppercase tracking-wider">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

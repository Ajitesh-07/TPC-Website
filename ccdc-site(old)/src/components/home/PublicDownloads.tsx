// INF = Internship Notification Form, JNF = Job Notification Form (recruiter-facing).
// Public, no-login downloads per the homepage brief. Wire `href` to real assets/links.
const DOWNLOADS = [
  {
    icon: 'description',
    title: 'Internship Notification Form (INF)',
    desc: 'For recruiters offering internship roles to IIT Patna students.',
    action: 'Download INF',
    href: '#',
  },
  {
    icon: 'work',
    title: 'Job Notification Form (JNF)',
    desc: 'For recruiters offering full-time / PPO positions.',
    action: 'Download JNF',
    href: '#',
  },
  {
    icon: 'auto_stories',
    title: 'Placement Brochure 2024-25',
    desc: 'Complete overview of programmes, statistics, and student profiles.',
    action: 'View Brochure',
    href: '#',
  },
  {
    icon: 'gavel',
    title: 'Placement Policy',
    desc: 'Rules, eligibility norms, and the code of conduct for the placement season.',
    action: 'Read Policy',
    href: '#',
  },
];

const PublicDownloads = () => {
  return (
    <section id="downloads" className="py-24 px-gutter-desktop bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16">
          <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-3">
            Resources
          </span>
          <h2 className="text-headline-lg font-headline-lg text-primary mb-4">Downloads</h2>
          <p className="text-body-lg font-body-lg text-text-secondary max-w-2xl mx-auto">
            Key forms and documents for recruiters and students — available without login.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOWNLOADS.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="glass-panel rounded-xl p-6 elevation-1 hover:elevation-2 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">{item.icon}</span>
              </div>
              <h3 className="text-title-md font-title-md text-primary mb-2">{item.title}</h3>
              <p className="text-body-md font-body-md text-text-secondary mb-5 flex-grow">{item.desc}</p>
              <span className="flex items-center gap-1 text-label-md font-label-md text-navy-vibrant group-hover:gap-2 transition-all">
                {item.action}
                <span className="material-symbols-outlined text-[18px]">download</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicDownloads;

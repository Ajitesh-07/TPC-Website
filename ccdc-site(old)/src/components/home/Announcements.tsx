const ANNOUNCEMENTS = [
  {
    date: 'Jun 05, 2026',
    tag: 'Timeline',
    tagTone: 'bg-primary-fixed text-primary',
    title: 'Placement Season 2026-27 registration opens',
    desc: 'Eligible B.Tech, M.Tech, and PhD students must complete profile verification before the first drive.',
  },
  {
    date: 'May 28, 2026',
    tag: 'Notice',
    tagTone: 'bg-secondary-container text-on-secondary-container',
    title: 'Resume submission deadline extended',
    desc: 'The portal will accept verified resumes until June 15. Late submissions affect drive eligibility.',
  },
  {
    date: 'May 20, 2026',
    tag: 'Event',
    tagTone: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Pre-placement bootcamp schedule released',
    desc: 'Aptitude and technical preparation sessions begin from the first week of July.',
  },
];

const Announcements = () => {
  return (
    <section id="announcements" className="py-24 px-gutter-desktop bg-surface">
      <div className="max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-3">
              Stay Updated
            </span>
            <h2 className="text-headline-lg font-headline-lg text-primary">Announcements</h2>
          </div>
          <a
            href="#"
            className="text-label-md font-label-md text-navy-vibrant flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all notices <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>

        <div className="flex flex-col gap-4">
          {ANNOUNCEMENTS.map((item) => (
            <article
              key={item.title}
              className="glass-panel rounded-xl p-6 elevation-1 hover:elevation-2 transition-shadow duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-8"
            >
              <div className="md:w-32 shrink-0">
                <span className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
                  {item.date}
                </span>
              </div>
              <div className="shrink-0">
                <span className={`inline-block px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wider ${item.tagTone}`}>
                  {item.tag}
                </span>
              </div>
              <div className="flex-grow">
                <h3 className="text-title-md font-title-md text-primary mb-1">{item.title}</h3>
                <p className="text-body-md font-body-md text-text-secondary">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Announcements;

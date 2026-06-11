import { RECRUITERS, logoUrl } from './recruiters';

// Duplicate the list so the -50% marquee translate loops seamlessly.
const MARQUEE_ITEMS = [...RECRUITERS, ...RECRUITERS];

const TrustedLeaders = () => {
  return (
    <section className="py-16 bg-navy-deep overflow-hidden">
      <div className="max-w-container-max mx-auto px-gutter-desktop mb-10 text-center">
        <h2 className="text-title-lg font-title-lg text-tertiary-fixed-dim uppercase tracking-wider">
          Trusted by Industry Leaders
        </h2>
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-navy-deep to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-navy-deep to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee">
          {MARQUEE_ITEMS.map((company, index) => (
            <div
              key={`${company.domain}-${index}`}
              className="flex items-center justify-center px-12 h-16 shrink-0"
              title={company.name}
            >
              <img
                src={logoUrl(company.domain)}
                alt={`${company.name} logo`}
                loading="lazy"
                className="max-h-8 max-w-[140px] object-contain brightness-0 invert opacity-60 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedLeaders;

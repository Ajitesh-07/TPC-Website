import SectionHeading from "@/components/ui/SectionHeading";
import { RECRUITERS, logoUrl } from "@/data/recruiters";

const PastRecruiters = () => {
  return (
    <section
      id="recruiters"
      className="py-24 px-gutter-desktop bg-surface-container-lowest"
    >
      <div className="max-w-container-max mx-auto">
        <SectionHeading
          eyebrow="Our Network"
          title="Past Recruiters"
          subtitle="Students from IIT Patna have been recruited by leading organisations across technology, core engineering, finance, and consulting."
          subtitleClassName="max-w-2xl mx-auto"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-surface-border rounded-xl overflow-hidden border border-surface-border">
          {RECRUITERS.map((company) => (
            <div
              key={company.domain}
              className="bg-surface-container-lowest flex items-center justify-center p-8 h-28 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              title={company.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl(company.domain)}
                alt={`${company.name} logo`}
                loading="lazy"
                className="max-h-10 max-w-[140px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PastRecruiters;

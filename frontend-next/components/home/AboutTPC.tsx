import IconTile from "@/components/ui/IconTile";
import { PILLARS } from "@/data/home";

const AboutTPC = () => {
  return (
    <section
      id="about"
      className="py-24 px-gutter-desktop bg-surface-container-lowest"
    >
      <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-3">
            About the Cell
          </span>
          <h2 className="text-headline-lg font-headline-lg text-primary mb-6 tracking-tight">
            Bridging Academic Excellence with Industry Ambition
          </h2>
          <p className="text-body-lg font-body-lg text-text-secondary mb-5">
            The Training &amp; Placement Cell of IIT Patna serves as the central
            link between our students and the corporate world. We facilitate
            internships, full-time placements, and pre-placement engagements
            across every academic programme.
          </p>
          <p className="text-body-md font-body-md text-text-secondary">
            <span className="font-semibold text-primary">Our mission</span> is to
            empower every student with the opportunities, guidance, and
            transparent processes needed to launch a meaningful career — while
            giving recruiters seamless access to one of India&apos;s most rigorous
            engineering talent pools.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="glass-panel rounded-xl p-6 elevation-1 hover:elevation-2 transition-shadow duration-300"
            >
              <IconTile icon={pillar.icon} className="mb-4" />
              <h3 className="text-title-md font-title-md text-primary mb-2">
                {pillar.title}
              </h3>
              <p className="text-body-md font-body-md text-text-secondary">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutTPC;

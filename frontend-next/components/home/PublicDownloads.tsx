import SectionHeading from "@/components/ui/SectionHeading";
import IconTile from "@/components/ui/IconTile";
import { DOWNLOADS } from "@/data/home";

const PublicDownloads = () => {
  return (
    <section
      id="downloads"
      className="py-24 px-gutter-desktop bg-surface-container-lowest"
    >
      <div className="max-w-container-max mx-auto">
        <SectionHeading
          eyebrow="Resources"
          title="Downloads"
          subtitle="Key forms and documents for recruiters and students — available without login."
          subtitleClassName="max-w-2xl mx-auto"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOWNLOADS.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="glass-panel rounded-xl p-6 elevation-1 hover:elevation-2 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              <IconTile icon={item.icon} className="mb-4" />
              <h3 className="text-title-md font-title-md text-primary mb-2">
                {item.title}
              </h3>
              <p className="text-body-md font-body-md text-text-secondary mb-5 grow">
                {item.desc}
              </p>
              <span className="flex items-center gap-1 text-label-md font-label-md text-navy-vibrant group-hover:gap-2 transition-all">
                {item.action}
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicDownloads;

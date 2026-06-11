import SectionHeading from "@/components/ui/SectionHeading";

const PlacementHighlights = () => {
  return (
    <section id="stats" className="py-24 px-gutter-desktop bg-surface">
      <div className="max-w-container-max mx-auto">
        <SectionHeading
          title="Placement Highlights 2023-24"
          subtitle="A testament to our rigorous academic standards and industry-aligned curriculum."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
          {/* Large stat */}
          <div className="md:col-span-2 md:row-span-2 glass-panel rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl group-hover:bg-primary-fixed/30 transition-colors duration-500"></div>
            <div className="z-10">
              <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-2">
                Highest Package
              </span>
              <div className="text-[72px] leading-none font-bold text-primary tracking-tighter mb-4">
                ₹82.05{" "}
                <span className="text-headline-md text-text-secondary font-medium">
                  LPA
                </span>
              </div>
              <p className="text-body-md font-body-md text-text-secondary max-w-sm">
                Secured by our top engineering talents in leading global tech
                firms during Phase I placements.
              </p>
            </div>
            <div className="z-10 flex items-center text-status-success text-label-md font-label-md mt-auto">
              <span className="material-symbols-outlined mr-1 text-[16px]">
                trending_up
              </span>{" "}
              14% increase from last year
            </div>
          </div>

          {/* Small stat 1 */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-2">
              Average Package (B.Tech)
            </span>
            <div className="text-headline-lg font-headline-lg text-primary">
              ₹23.09 <span className="text-title-md text-text-secondary">LPA</span>
            </div>
          </div>

          {/* Small stat 2 */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-center items-start bg-navy-deep border-none text-on-primary">
            <span className="text-label-md font-label-md text-tertiary-fixed-dim uppercase tracking-wider block mb-2">
              Offers Made
            </span>
            <div className="text-headline-lg font-headline-lg text-white">
              412+
            </div>
            <p className="text-label-sm font-label-sm text-tertiary-fixed-dim mt-2">
              Across 120+ Companies
            </p>
          </div>

          {/* Medium stat */}
          <div className="md:col-span-3 glass-panel rounded-xl p-8 flex flex-col md:flex-row items-center justify-between">
            <div>
              <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-2">
                Top Recruiting Sectors
              </span>
              <div className="text-title-lg font-title-lg text-primary">
                IT/Software, Core Engineering, Finance, Analytics
              </div>
            </div>
            <a
              href="#downloads"
              className="mt-4 md:mt-0 border border-primary text-primary px-6 py-2 rounded-lg text-label-md font-label-md hover:bg-primary hover:text-white transition-colors duration-200"
            >
              View Detailed Report
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlacementHighlights;

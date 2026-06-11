import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { COMPANY_ITINERARY, COMPANY_ACTIVITY } from "@/data/company";

const HR_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWyecKY1tZpSOBiDCwB_MDiiIJYPynz7AYTvYSwRHELaPAIZMFUnf8jP2__cOWwXXm_lGbBPnXvoSirTeqyipT4cPuJ4DZFpY71pLGDuTfEsL7s03AO4UEByMrE-BLq9efz9xSvhoKT2YEGlaaqKdzxQ6tpl4fxV9822mZ9K4_bYgG1MQas3UYS4ED3oMMJdUsu6KzZJKTfGrZ7d-3MioZc8G6ZWo5s6tzcA8o3-xNlghKjrlNFNDnVhnFtom69BQsTwaMNEYp_jCf";

const CompanyDashboard = () => {
  return (
    <div className="flex-1 p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full">
      {/* HR profile banner */}
      <section className="relative rounded-xl overflow-hidden mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-border">
        <div className="h-32 md:h-40 w-full bg-gradient-to-r from-navy-deep to-primary-container relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          ></div>
        </div>
        <div className="glass-panel relative px-6 pb-6 pt-16 md:pt-6 md:flex md:items-end md:justify-between -mt-12 md:-mt-0 rounded-b-xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:absolute md:bottom-6 md:left-6">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white overflow-hidden relative z-10 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="HR Professional Profile"
                className="w-full h-full object-cover"
                src={HR_AVATAR}
              />
            </div>
            <div className="text-center md:text-left md:mb-1 z-10 md:ml-[110px]">
              <h1 className="text-headline-md font-headline-md text-text-primary mb-1">
                TechFlow Solutions Inc.
              </h1>
              <p className="text-body-md font-body-md text-text-secondary flex items-center justify-center md:justify-start gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  location_on
                </span>
                Bangalore, India • Software Development
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex gap-3 justify-center md:justify-end w-full md:w-auto relative z-10">
            <button className="px-4 py-2 rounded-lg border border-surface-border bg-white text-text-primary text-label-md font-label-md font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Key metrics grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative overflow-hidden group hover:border-primary-fixed-dim transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px] text-primary">
              groups
            </span>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
              Total Applicants
            </p>
            <h2 className="text-display-lg font-display-lg text-text-primary">
              1,248
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-status-success text-label-md font-label-md">
            <span className="material-symbols-outlined text-[16px]">
              trending_up
            </span>
            <span>+12% from last week</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative overflow-hidden group hover:border-primary-fixed-dim transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px] text-primary">
              campaign
            </span>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
              Ongoing Drives
            </p>
            <h2 className="text-display-lg font-display-lg text-text-primary">3</h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-text-secondary text-label-md font-label-md">
            <span className="w-2 h-2 rounded-full bg-status-warning"></span>
            <span>SDE, Data Analyst, Product</span>
          </div>
        </div>

        {/* Action card (quick JDs) */}
        <div className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div>
            <p className="text-label-sm font-label-sm text-primary-fixed-dim uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            <h3 className="text-title-lg font-title-lg text-white mb-4">
              Job Descriptions
            </h3>
          </div>
          <div className="flex flex-col gap-3 relative z-10">
            <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg flex items-center justify-between transition-colors text-label-md font-label-md">
              <span>Upload New JD</span>
              <span className="material-symbols-outlined text-[18px]">
                upload_file
              </span>
            </button>
            <button className="w-full bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-primary-fixed-dim py-2 px-4 rounded-lg flex items-center justify-between transition-colors text-label-md font-label-md">
              <span>View Active JDs</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Campus itinerary */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-title-lg text-text-primary">
              Campus Itinerary
            </h3>
            <button className="text-primary text-label-md font-label-md font-medium hover:underline flex items-center gap-1">
              Full Schedule{" "}
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            </button>
          </div>
          <Timeline
            rail="border-l-2 border-surface-variant"
            spacing="space-y-8"
            className="pb-4"
          >
            {COMPANY_ITINERARY.map((item) => (
              <TimelineItem
                key={item.title}
                padding="pl-8"
                dotClassName={`w-4 h-4 rounded-full border-4 border-white -left-[9px] top-1 shadow-sm ${
                  item.active ? "bg-primary" : "bg-surface-variant"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <h4 className="text-title-md font-title-md text-text-primary">
                      {item.title}
                    </h4>
                    <p className="text-body-md font-body-md text-text-secondary mt-1">
                      {item.location}
                    </p>
                    {item.tag && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm">
                        <span className="material-symbols-outlined text-[14px]">
                          groups
                        </span>{" "}
                        {item.tag}
                      </div>
                    )}
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <span className="block text-label-md font-label-md text-text-primary font-bold">
                      {item.date}
                    </span>
                    <span className="block text-label-sm font-label-sm text-text-secondary mt-1">
                      {item.time}
                    </span>
                  </div>
                </div>
              </TimelineItem>
            ))}
          </Timeline>
        </section>

        {/* Recent activity */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-title-lg font-title-lg text-text-primary mb-6">
            Recent Activity
          </h3>
          <ul className="space-y-4">
            {COMPANY_ACTIVITY.map((activity, i) => (
              <li key={i} className="flex gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.iconWrapClassName}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {activity.icon}
                  </span>
                </div>
                <div>
                  <p className="text-body-md font-body-md text-text-primary">
                    {activity.text}
                  </p>
                  <span className="text-label-sm font-label-sm text-text-secondary mt-1 block">
                    {activity.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CompanyDashboard;

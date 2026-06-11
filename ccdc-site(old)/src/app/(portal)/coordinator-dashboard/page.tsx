const CoordinatorDashboard = () => {
  return (
    <>
      {/* Dashboard Header */}
      <div className="px-gutter-mobile md:px-gutter-desktop py-6 md:py-8 sticky top-0 bg-surface/90 backdrop-blur-md z-30 border-b border-surface-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-container-max mx-auto">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-text-primary">Overview</h1>
            <p className="text-body-md font-body-md text-text-secondary mt-1">Placement Season 2024-25</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-surface-container-lowest border border-surface-border text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:border-primary transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined" data-icon="download">download</span>
              Export Report
            </button>
            <button className="bg-gradient-to-b from-primary to-navy-deep border-t border-primary-fixed-dim/30 text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow flex items-center gap-2">
              <span className="material-symbols-outlined" data-icon="add">add</span>
              Create Drive
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1 max-w-container-max mx-auto w-full">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Metric 1 */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed-dim/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-label-sm font-label-sm text-text-secondary uppercase">Active Drives</span>
              <span className="material-symbols-outlined text-primary" data-icon="work">work</span>
            </div>
            <div className="text-headline-md font-headline-md text-text-primary relative z-10">24</div>
            <div className="text-label-sm font-label-sm text-status-success mt-1 flex items-center gap-1 relative z-10">
              <span className="material-symbols-outlined text-[14px]" data-icon="arrow_upward">arrow_upward</span>
              +3 this week
            </div>
          </div>
          {/* Metric 2 */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-container/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-label-sm font-label-sm text-text-secondary uppercase">Pending Apps</span>
              <span className="material-symbols-outlined text-status-warning" data-icon="pending_actions">pending_actions</span>
            </div>
            <div className="text-headline-md font-headline-md text-text-primary relative z-10">156</div>
            <div className="text-label-sm font-label-sm text-text-secondary mt-1 relative z-10">Across 8 companies</div>
          </div>
          {/* Metric 3 */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-label-sm font-label-sm text-text-secondary uppercase">Offers Made</span>
              <span className="material-symbols-outlined text-status-success" data-icon="verified">verified</span>
            </div>
            <div className="text-headline-md font-headline-md text-text-primary relative z-10">342</div>
            <div className="text-label-sm font-label-sm text-text-secondary mt-1 relative z-10">YTD 2024</div>
          </div>
          {/* Metric 4 */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-navy-vibrant/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-label-sm font-label-sm text-text-secondary uppercase">Upcoming Int.</span>
              <span className="material-symbols-outlined text-navy-vibrant" data-icon="event_upcoming">event_upcoming</span>
            </div>
            <div className="text-headline-md font-headline-md text-text-primary relative z-10">12</div>
            <div className="text-label-sm font-label-sm text-text-secondary mt-1 relative z-10">Next 48 hours</div>
          </div>
        </div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Wider) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Active Drives Table */}
            <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
                <h2 className="text-title-md font-title-md text-text-primary">Ongoing Placement Drives</h2>
                <button className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Applicants</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md font-body-md">
                    <tr className="border-b border-surface-variant hover:bg-surface-container-low transition-colors group">
                      <td className="px-4 py-3 font-medium text-text-primary">Google</td>
                      <td className="px-4 py-3 text-text-secondary">Software Engineer</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-status-warning/10 text-status-warning text-label-sm font-label-sm">Shortlisting</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">450</td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-surface-variant bg-neutral-50 hover:bg-surface-container-low transition-colors group">
                      <td className="px-4 py-3 font-medium text-text-primary">Microsoft</td>
                      <td className="px-4 py-3 text-text-secondary">Data Scientist</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-navy-vibrant/10 text-navy-vibrant text-label-sm font-label-sm">Interviews</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">120</td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-surface-variant hover:bg-surface-container-low transition-colors group">
                      <td className="px-4 py-3 font-medium text-text-primary">Amazon</td>
                      <td className="px-4 py-3 text-text-secondary">SDE-1</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-status-success/10 text-status-success text-label-sm font-label-sm">Offers Rolled</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">300</td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-4 py-3 font-medium text-text-primary">Goldman Sachs</td>
                      <td className="px-4 py-3 text-text-secondary">Analyst</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-surface-variant text-text-secondary text-label-sm font-label-sm">Registration</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">55</td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-xl p-5 border border-surface-border flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                  <span className="material-symbols-outlined" data-icon="campaign">campaign</span>
                </div>
                <div>
                  <h3 className="text-title-md font-title-md text-text-primary mb-1">Announce Results</h3>
                  <p className="text-body-md font-body-md text-text-secondary mb-3">Google shortlist is ready for publication.</p>
                  <button className="text-label-md font-label-md text-primary font-semibold hover:underline">Review & Publish</button>
                </div>
              </div>
              <div className="bg-error-container/30 rounded-xl p-5 border border-error/20 flex items-start gap-4">
                <div className="bg-error/10 p-3 rounded-lg text-status-error shrink-0">
                  <span className="material-symbols-outlined" data-icon="error_outline">error_outline</span>
                </div>
                <div>
                  <h3 className="text-title-md font-title-md text-text-primary mb-1">Urgent Verification</h3>
                  <p className="text-body-md font-body-md text-text-secondary mb-3">12 student profiles require manual approval.</p>
                  <button className="text-label-md font-label-md text-status-error font-semibold hover:underline">Verify Now</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar-like) */}
          <div className="flex flex-col gap-6">
            {/* Calendar Widget */}
            <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4">
              <h2 className="text-title-md font-title-md text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-text-secondary" data-icon="calendar_month">calendar_month</span>
                Upcoming Schedule
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3 relative before:absolute before:left-1.5 before:top-6 before:bottom-0 before:w-px before:bg-surface-border last:before:hidden">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest"></div>
                  <div>
                    <div className="text-label-md font-label-md text-primary font-semibold">Today, 10:00 AM</div>
                    <div className="text-body-md font-body-md text-text-primary font-medium">Microsoft PPT</div>
                    <div className="text-label-sm font-label-sm text-text-secondary">Senate Hall</div>
                  </div>
                </div>
                <div className="flex gap-3 relative before:absolute before:left-1.5 before:top-6 before:bottom-0 before:w-px before:bg-surface-border last:before:hidden">
                  <div className="w-3 h-3 rounded-full bg-navy-vibrant mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest"></div>
                  <div>
                    <div className="text-label-md font-label-md text-navy-vibrant font-semibold">Tomorrow, 09:00 AM</div>
                    <div className="text-body-md font-body-md text-text-primary font-medium">Amazon OA</div>
                    <div className="text-label-sm font-label-sm text-text-secondary">Computer Center</div>
                  </div>
                </div>
                <div className="flex gap-3 relative last:before:hidden">
                  <div className="w-3 h-3 rounded-full bg-surface-variant mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest border border-outline-variant"></div>
                  <div>
                    <div className="text-label-md font-label-md text-text-secondary font-semibold">Oct 25, 14:00 PM</div>
                    <div className="text-body-md font-body-md text-text-primary font-medium">Goldman Sachs Interviews</div>
                    <div className="text-label-sm font-label-sm text-text-secondary">Virtual</div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2 border border-surface-border rounded-lg text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors">View Full Calendar</button>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4">
              <h2 className="text-title-md font-title-md text-text-primary mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-surface-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary">
                  <span className="material-symbols-outlined mb-1" data-icon="group_add">group_add</span>
                  <span className="text-label-sm font-label-sm text-center">Add Student</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-surface-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary">
                  <span className="material-symbols-outlined mb-1" data-icon="domain_add">domain_add</span>
                  <span className="text-label-sm font-label-sm text-center">Add Company</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-surface-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary">
                  <span className="material-symbols-outlined mb-1" data-icon="mail">mail</span>
                  <span className="text-label-sm font-label-sm text-center">Send Email</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-surface-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary">
                  <span className="material-symbols-outlined mb-1" data-icon="insert_chart">insert_chart</span>
                  <span className="text-label-sm font-label-sm text-center">Generate Stats</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoordinatorDashboard;

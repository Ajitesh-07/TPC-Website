import React from 'react';

const SuperAdminDashboard = () => {
  return (
    <div className="flex-1 p-gutter-mobile md:p-gutter-desktop space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">Global Dashboard</h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">Admin &amp; Credit Management Overview</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">search</span>
            <input className="pl-9 pr-4 py-2 rounded-lg border border-surface-border bg-surface-container-lowest text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64" placeholder="Search directory..." type="text" />
          </div>
          <button className="bg-surface-container-lowest border border-surface-border p-2 rounded-lg text-text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Quick Stats (Spans full width on mobile, 8 cols on desktop) */}
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stat Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border elevation-1 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-container/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">Total Placements</span>
              <span className="material-symbols-outlined text-primary-fixed-dim">school</span>
            </div>
            <div className="z-10">
              <div className="text-headline-md font-headline-md text-primary">1,248</div>
              <div className="text-label-sm font-label-sm text-status-success flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[12px]">arrow_upward</span> +12% yoy
              </div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border elevation-1 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary-container/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">Active Companies</span>
              <span className="material-symbols-outlined text-secondary-fixed-dim">domain</span>
            </div>
            <div className="z-10">
              <div className="text-headline-md font-headline-md text-primary">156</div>
              <div className="text-label-sm font-label-sm text-status-success flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[12px]">arrow_upward</span> +5 new this week
              </div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border elevation-1 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-error-container/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">Flagged Profiles</span>
              <span className="material-symbols-outlined text-status-error">flag</span>
            </div>
            <div className="z-10">
              <div className="text-headline-md font-headline-md text-primary">24</div>
              <div className="text-label-sm font-label-sm text-text-secondary flex items-center gap-1 mt-1">
                Requires review
              </div>
            </div>
          </div>

          {/* Stat Card 4 */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border elevation-1 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-tertiary-fixed-dim/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">Avg Credits</span>
              <span className="material-symbols-outlined text-tertiary-container">toll</span>
            </div>
            <div className="z-10">
              <div className="text-headline-md font-headline-md text-primary">850</div>
              <div className="text-label-sm font-label-sm text-status-warning flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[12px]">arrow_downward</span> -5% from avg
              </div>
            </div>
          </div>
        </div>

        {/* Credit Management Widget (Spans 4 cols on desktop) */}
        <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="text-title-md font-title-md font-semibold">Credit Management</h3>
            <button className="text-on-primary/70 hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5 mb-4">
              <label className="text-label-sm font-label-sm text-on-primary/70 block mb-1">Quick Adjust Student Credits</label>
              <div className="flex gap-2 mt-2">
                <input className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-body-md text-white placeholder-white/40 focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf outline-none" placeholder="Roll No." type="text" />
                <input className="w-20 bg-white/5 border border-white/20 rounded px-3 py-2 text-body-md text-white placeholder-white/40 focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf outline-none" placeholder="+/-" type="number" />
              </div>
              <button className="w-full mt-3 bg-gold-leaf text-on-secondary-fixed-variant py-2 rounded font-title-md text-sm hover:bg-secondary-container transition-colors shadow-sm">
                Apply Adjustment
              </button>
            </div>
            <a className="text-label-sm font-label-sm text-gold-leaf hover:underline flex items-center gap-1 self-start mt-auto" href="#">
              View Full Audit Log <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Placements Analysis Chart Area (Spans 8 cols) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-md font-title-md text-primary">Placement Trajectory</h3>
            <select className="text-label-md font-label-md bg-surface border border-surface-border rounded px-2 py-1 text-text-secondary outline-none focus:border-primary">
              <option>2023-2024</option>
              <option>2022-2023</option>
            </select>
          </div>
          {/* Placeholder for Chart */}
          <div className="flex-1 bg-surface-container-low rounded-lg border border-dashed border-outline-variant flex items-center justify-center min-h-[250px] relative">
            {/* Decorative Chart Placeholder */}
            <div className="absolute bottom-0 left-0 w-full h-[80%] flex items-end justify-between px-4 pb-4 gap-2 opacity-40">
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[40%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[55%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[45%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[70%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[60%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[85%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[75%]"></div>
              <div className="w-1/12 bg-primary-fixed-dim rounded-t h-[95%]"></div>
            </div>
            <span className="text-text-secondary text-body-md z-10 flex items-center gap-2">
              <span className="material-symbols-outlined">insights</span>
              Interactive Chart Component
            </span>
          </div>
        </div>

        {/* Role Management List (Spans 4 cols) */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
            <h3 className="text-title-md font-title-md text-primary">Recent Role Changes</h3>
            <button className="text-primary hover:bg-surface-container rounded-full p-1 transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {/* List Item */}
            <div className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-label-md font-bold">AK</div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-body-md text-primary truncate">Amit Kumar</p>
                <p className="text-label-sm font-label-sm text-text-secondary truncate">Promoted to Coordinator</p>
              </div>
              <span className="text-label-sm text-text-secondary">2h ago</span>
            </div>
            {/* List Item */}
            <div className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-fixed-variant flex items-center justify-center text-label-md font-bold">SR</div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-body-md text-primary truncate">Sneha Reddy</p>
                <p className="text-label-sm font-label-sm text-text-secondary truncate">Access Revoked</p>
              </div>
              <span className="text-label-sm text-text-secondary">5h ago</span>
            </div>
            {/* List Item */}
            <div className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-surface-variant text-text-secondary flex items-center justify-center text-label-md font-bold">VP</div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-body-md text-primary truncate">Vikram Patel</p>
                <p className="text-label-sm font-label-sm text-text-secondary truncate">Added as Volunteer</p>
              </div>
              <span className="text-label-sm text-text-secondary">1d ago</span>
            </div>
          </div>
          <div className="p-3 border-t border-surface-border text-center bg-surface-bright">
            <a className="text-label-sm font-label-sm text-primary hover:underline" href="#">View All Roles</a>
          </div>
        </div>

        {/* High-Density Directory Table (Spans full 12 cols) */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden mt-4">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
            <div>
              <h3 className="text-title-md font-title-md text-primary">Student Directory</h3>
              <p className="text-label-md font-label-md text-text-secondary">Manage and view student placement statuses.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-1 text-label-md font-label-md px-3 py-1.5 border border-surface-border rounded bg-white hover:bg-surface-container-low transition-colors text-text-secondary">
                <span className="material-symbols-outlined text-[16px]">download</span> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold border-b border-surface-border w-12"></th>
                  <th className="py-3 px-4 font-semibold border-b border-surface-border">Roll No / Name</th>
                  <th className="py-3 px-4 font-semibold border-b border-surface-border">Department</th>
                  <th className="py-3 px-4 font-semibold border-b border-surface-border">Credits</th>
                  <th className="py-3 px-4 font-semibold border-b border-surface-border">Status</th>
                  <th className="py-3 px-4 font-semibold border-b border-surface-border text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-body-md font-body-md text-on-surface">
                {/* Row 1 */}
                <tr className="border-b border-surface-border hover:bg-surface-container-low transition-colors">
                  <td className="py-2 px-4">
                    <div className="w-8 h-8 rounded bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">21CS</div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="font-medium text-primary">2101CS01</div>
                    <div className="text-label-sm text-text-secondary">Aarav Sharma</div>
                  </td>
                  <td className="py-2 px-4 text-text-secondary">Computer Science</td>
                  <td className="py-2 px-4 font-mono text-sm">1,200</td>
                  <td className="py-2 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-success/10 text-status-success border border-status-success/20">
                      Placed
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button className="text-text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button className="text-text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-[18px]">more_vert</span></button>
                  </td>
                </tr>
                {/* Row 2 */}
                <tr className="border-b border-surface-border hover:bg-surface-container-low transition-colors bg-neutral-50/50">
                  <td className="py-2 px-4">
                    <div className="w-8 h-8 rounded bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">21EE</div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="font-medium text-primary">2101EE45</div>
                    <div className="text-label-sm text-text-secondary">Diya Patel</div>
                  </td>
                  <td className="py-2 px-4 text-text-secondary">Electrical Eng.</td>
                  <td className="py-2 px-4 font-mono text-sm">850</td>
                  <td className="py-2 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-warning/10 text-status-warning border border-status-warning/20">
                      Eligible
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button className="text-text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button className="text-text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-[18px]">more_vert</span></button>
                  </td>
                </tr>
                {/* Row 3 */}
                <tr className="border-b border-surface-border hover:bg-surface-container-low transition-colors">
                  <td className="py-2 px-4">
                    <div className="w-8 h-8 rounded bg-error-container text-on-error-container flex items-center justify-center font-bold text-xs">21ME</div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="font-medium text-primary">2101ME12</div>
                    <div className="text-label-sm text-text-secondary">Rohan Gupta</div>
                  </td>
                  <td className="py-2 px-4 text-text-secondary">Mechanical Eng.</td>
                  <td className="py-2 px-4 font-mono text-sm text-status-error font-medium">-150</td>
                  <td className="py-2 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-container text-on-error-container border border-error/20">
                      Blocked
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button className="text-text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button className="text-text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-[18px]">more_vert</span></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-surface-bright flex justify-between items-center text-label-sm text-text-secondary">
            <span>Showing 1-3 of 842 students</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-surface-variant rounded disabled:opacity-50" disabled><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
              <button className="p-1 hover:bg-surface-variant rounded"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

// Navigation + link data for the public site and the portal sidebar.
// Edit links/labels here rather than inside the layout components.

import type { Role } from "@/lib/roles";

export interface NavLink {
  label: string;
  href: string;
}

/** Public navbar (desktop) section links. */
export const NAVBAR_LINKS: NavLink[] = [
  { label: "About", href: "/#about" },
  { label: "Placement Stats", href: "/#stats" },
  { label: "Recruiters", href: "/#recruiters" },
  { label: "Downloads", href: "/#downloads" },
];

/** Footer link columns. */
export const FOOTER_QUICK_LINKS: NavLink[] = [
  { label: "About TPC", href: "/#about" },
  { label: "Placement Stats", href: "/#stats" },
  { label: "Past Recruiters", href: "/#recruiters" },
  { label: "Announcements", href: "/#announcements" },
];

export const FOOTER_RESOURCES: NavLink[] = [
  { label: "Downloads (INF / JNF)", href: "/#downloads" },
  { label: "Placement Brochure", href: "/#downloads" },
  { label: "Placement Policy", href: "/#downloads" },
  { label: "Student Portal", href: "/#portal-access" },
];

/** Material Symbols icon name + link for a portal sidebar entry.
 *  `roles` controls which roles see the item; active styling is derived from
 *  the current route in the Sidebar component. */
export interface SidebarItem {
  label: string;
  icon: string;
  href: string;
  roles: Role[];
}

// One master list; the Sidebar filters it by the current role. Each role's
// "Dashboard" points at that role's landing page. Add new pages here (tagged
// with the roles that should see them) as they ship.
const ALL_ROLES: Role[] = ["student", "company", "coordinator", "admin", "super-admin"];

export const SIDEBAR_ITEMS: SidebarItem[] = [
  // Per-role dashboards (same label, different destination).
  { label: "Dashboard", icon: "dashboard", href: "/student-dashboard", roles: ["student"] },
  { label: "Dashboard", icon: "dashboard", href: "/company-dashboard", roles: ["company"] },
  { label: "Dashboard", icon: "dashboard", href: "/coordinator-dashboard", roles: ["coordinator"] },
  { label: "Dashboard", icon: "dashboard", href: "/admin-dashboard", roles: ["admin"] },
  { label: "Dashboard", icon: "dashboard", href: "/super-admin-dashboard", roles: ["super-admin"] },

  // Student
  { label: "Drives", icon: "work", href: "/drive-catalogue", roles: ["student", "coordinator", "admin", "super-admin"] },
  { label: "My Profile", icon: "person", href: "/my-profile", roles: ["student"] },

  // Company
  { label: "Job Announcement", icon: "post_add", href: "/jaf", roles: ["company"] },
  { label: "Logistics", icon: "local_shipping", href: "/logistics", roles: ["company"] },

  // Coordinator
  { label: "Add Drive", icon: "add_business", href: "/add-drive", roles: ["coordinator"] },
  { label: "Drive Workspace", icon: "space_dashboard", href: "/drive-workspace", roles: ["coordinator"] },
  { label: "Student Directory", icon: "person_search", href: "/student-profiles", roles: ["coordinator", "admin", "super-admin"] },

  // Admin + super admin tools
  { label: "Credit Management", icon: "paid", href: "/credit-management", roles: ["admin", "super-admin"] },
  { label: "Manage Companies", icon: "domain_add", href: "/manage-companies", roles: ["admin", "super-admin"] },
  { label: "Company Contacts", icon: "contacts", href: "/company-contacts", roles: ["admin", "super-admin"] },

  // Super admin only
  { label: "User Management", icon: "manage_accounts", href: "/user-management", roles: ["super-admin"] },
  { label: "Audit Log", icon: "history", href: "/audit-log", roles: ["super-admin"] },
  { label: "Global Export", icon: "database", href: "/global-export", roles: ["super-admin"] },

  // Shared
  { label: "Calendar", icon: "event", href: "/calendar", roles: ALL_ROLES },
  { label: "Notifications", icon: "notifications", href: "/notifications", roles: ALL_ROLES },
];

/** Staff role logins on the homepage Portal Access section. The entry sets the
 *  mock role, then routes to that role's DEFAULT_DASHBOARD. */
export interface StaffRole {
  label: string;
  icon: string;
  role: Role;
}

export const STAFF_ROLES: StaffRole[] = [
  { label: "Coordinator", icon: "badge", role: "coordinator" },
  { label: "Admin", icon: "admin_panel_settings", role: "admin" },
  { label: "Super Admin", icon: "shield_person", role: "super-admin" },
];

/** Contact details shown in the Contact Us section. */
export interface ContactDetail {
  icon: string;
  label: string;
  value: string;
}

export const CONTACT_DETAILS: ContactDetail[] = [
  {
    icon: "location_on",
    label: "Address",
    value: "Training & Placement Cell, IIT Patna, Bihta, Patna, Bihar – 801106",
  },
  { icon: "mail", label: "Email", value: "tpc@iitp.ac.in" },
  { icon: "call", label: "Phone", value: "+91 612 302 8XXX" },
];

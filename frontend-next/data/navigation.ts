// Navigation + link data for the public site and the portal sidebar.
// Edit links/labels here rather than inside the layout components.

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
 *  Active styling is derived from the current route in the Sidebar component. */
export interface SidebarItem {
  label: string;
  icon: string;
  href: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/student-dashboard" },
  { label: "Drives", icon: "work", href: "/drive-catalogue" },
  // Admin/coordinator view — the directory of all students. A student reaches
  // their own profile via the avatar in the page header, not from here.
  { label: "Profiles", icon: "person_search", href: "/student-profiles" },
  { label: "Applications", icon: "assignment_turned_in", href: "#" },
  { label: "Calendar", icon: "event", href: "/calendar" },
  { label: "Coordinator DB", icon: "admin_panel_settings", href: "/coordinator-dashboard" },
  { label: "Settings", icon: "settings", href: "#" },
];

/** Staff role logins on the homepage Portal Access section.
 *  NOTE: a dedicated /admin-dashboard route does not exist yet — Admin
 *  temporarily points at the super-admin dashboard. */
export interface StaffRole {
  label: string;
  icon: string;
  href: string;
}

export const STAFF_ROLES: StaffRole[] = [
  { label: "Coordinator", icon: "badge", href: "/coordinator-dashboard" },
  { label: "Admin", icon: "admin_panel_settings", href: "/super-admin-dashboard" },
  { label: "Super Admin", icon: "shield_person", href: "/super-admin-dashboard" },
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

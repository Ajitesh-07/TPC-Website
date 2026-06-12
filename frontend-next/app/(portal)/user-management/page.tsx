"use client";

import { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  ROLE_OPTIONS,
  MANAGED_USERS,
  APPROVED_EMAILS,
  UPLOAD_HISTORY,
  type ManagedUser,
  type UploadRecord,
} from "@/data/user-management";

type TabKey = "users" | "emails" | "upload";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "users", label: "Users & Roles", icon: "manage_accounts" },
  { key: "emails", label: "Approved Emails", icon: "alternate_email" },
  { key: "upload", label: "Master Data Upload", icon: "cloud_upload" },
];

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  // Users & Roles
  const [users, setUsers] = useState<ManagedUser[]>(MANAGED_USERS);
  const [query, setQuery] = useState("");

  // Approved Emails
  const [emails, setEmails] = useState<string[]>(APPROVED_EMAILS);
  const [newEmail, setNewEmail] = useState("");

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  const changeRole = (id: string, role: string) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));

  const toggleStatus = (id: string) =>
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Revoked" : "Active" }
          : u
      )
    );

  const addEmail = () => {
    const value = newEmail.trim().toLowerCase();
    if (!value || emails.includes(value)) return;
    setEmails((prev) => [...prev, value]);
    setNewEmail("");
  };

  const removeEmail = (value: string) =>
    setEmails((prev) => prev.filter((e) => e !== value));

  const USER_COLUMNS: Column<ManagedUser>[] = [
    {
      header: "Name",
      className: "py-3 px-4",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-md font-label-md font-bold shrink-0">
            {u.initials}
          </div>
          <span className="font-medium text-text-primary">{u.name}</span>
        </div>
      ),
    },
    {
      header: "Email",
      className: "py-3 px-4 text-text-secondary text-body-md font-body-md",
      render: (u) => u.email,
    },
    {
      header: "Current Role",
      className: "py-3 px-4",
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => changeRole(u.id, e.target.value)}
          aria-label={`Role for ${u.name}`}
          className="bg-surface-container-low border border-surface-border rounded-lg px-3 py-1.5 text-label-md font-label-md text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Status",
      className: "py-3 px-4",
      render: (u) =>
        u.status === "Active" ? (
          <StatusBadge tone="success" icon="check_circle" bordered>
            Active
          </StatusBadge>
        ) : (
          <StatusBadge tone="error" icon="block" bordered>
            Revoked
          </StatusBadge>
        ),
    },
    {
      header: "Action",
      headerClassName: "text-right",
      className: "py-3 px-4 text-right",
      render: (u) =>
        u.status === "Active" ? (
          <button
            onClick={() => toggleStatus(u.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">block</span>
            Revoke
          </button>
        ) : (
          <button
            onClick={() => toggleStatus(u.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-status-success/30 text-status-success text-label-md font-label-md hover:bg-status-success/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Restore
          </button>
        ),
    },
  ];

  const UPLOAD_COLUMNS: Column<UploadRecord>[] = [
    {
      header: "File Name",
      className: "py-3 px-4",
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">
            description
          </span>
          <span className="font-medium text-text-primary">{r.fileName}</span>
        </div>
      ),
    },
    {
      header: "Type",
      className: "py-3 px-4",
      render: (r) => (
        <StatusBadge tone="info">{r.type}</StatusBadge>
      ),
    },
    {
      header: "Uploaded By",
      className: "py-3 px-4 text-text-secondary text-body-md font-body-md",
      render: (r) => r.uploadedBy,
    },
    {
      header: "Date",
      className: "py-3 px-4 text-text-secondary text-body-md font-body-md",
      render: (r) => r.date,
    },
    {
      header: "Rows",
      headerClassName: "text-right",
      className: "py-3 px-4 text-right font-mono text-sm text-on-surface",
      render: (r) => r.rows.toLocaleString(),
    },
  ];

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md px-gutter-mobile md:px-gutter-desktop py-6">
        <div className="max-w-container-max mx-auto">
          <h2 className="text-headline-md font-headline-md text-text-primary">
            User Management
          </h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">
            Assign roles, manage access, and control institute data.
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full">
        {/* Tab toggle */}
        <div className="bg-surface-container-low p-1 rounded-xl flex overflow-x-auto no-scrollbar mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-title-md font-title-md transition-all whitespace-nowrap shrink-0",
                activeTab === tab.key
                  ? "bg-surface shadow-sm text-primary"
                  : "text-text-secondary hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Users & Roles */}
        {activeTab === "users" && (
          <div className="animate-fadeIn">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
                <div>
                  <h3 className="text-title-md font-title-md text-primary">
                    Users &amp; Roles
                  </h3>
                  <p className="text-label-md font-label-md text-text-secondary">
                    Reassign roles and control portal access per user.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    search
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                    placeholder="Search by name or email..."
                    type="text"
                  />
                </div>
              </div>
              {visibleUsers.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] opacity-50">
                    person_search
                  </span>
                  <p className="text-title-md font-title-md mt-2">No users match your search</p>
                </div>
              ) : (
                <DataTable
                  columns={USER_COLUMNS}
                  rows={visibleUsers}
                  theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                  thClassName="py-3 px-4 font-semibold border-b border-surface-border"
                  rowClassName={(_, i) =>
                    cn(
                      "border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface",
                      i % 2 === 1 && "bg-neutral-50/50"
                    )
                  }
                />
              )}
              <div className="p-3 bg-surface-bright text-label-sm text-text-secondary">
                Showing {visibleUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        )}

        {/* TAB: Approved Emails */}
        {activeTab === "emails" && (
          <div className="animate-fadeIn max-w-2xl">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 border-b border-surface-border bg-surface-bright">
                <h3 className="text-title-md font-title-md text-primary">
                  Approved Emails &amp; Domains
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  Only addresses matching this list may sign up for the portal.
                </p>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      alternate_email
                    </span>
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEmail();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                      placeholder="e.g. @iitp.ac.in or name@iitp.ac.in"
                      type="text"
                    />
                  </div>
                  <button
                    onClick={addEmail}
                    disabled={!newEmail.trim()}
                    className="btn-gradient text-on-primary px-5 py-2.5 rounded-lg text-title-md font-title-md shadow-sm hover-lift inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add
                  </button>
                </div>

                <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
                  {emails.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {email.startsWith("@") ? "domain" : "mail"}
                        </span>
                        <span className="text-body-md font-body-md text-text-primary truncate">
                          {email}
                        </span>
                      </div>
                      <button
                        onClick={() => removeEmail(email)}
                        aria-label={`Remove ${email}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Master Data Upload */}
        {activeTab === "upload" && (
          <div className="animate-fadeIn space-y-8">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 border-b border-surface-border bg-surface-bright">
                <h3 className="text-title-md font-title-md text-primary">
                  Master Data Upload
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  Bulk-import student, company, or credit records.
                </p>
              </div>
              <div className="p-5 space-y-5">
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface-container-low hover:border-primary transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      cloud_upload
                    </span>
                  </div>
                  <span className="text-title-md font-title-md text-text-primary mb-1">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-label-md font-label-md text-text-secondary">
                    CSV, XLSX up to 10MB
                  </span>
                </div>
                <div className="flex justify-end">
                  <button className="btn-gradient text-on-primary px-6 py-2.5 rounded-lg text-title-md font-title-md shadow-sm hover-lift inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    Upload
                  </button>
                </div>
              </div>
            </div>

            {/* Recent uploads */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 border-b border-surface-border bg-surface-bright">
                <h3 className="text-title-md font-title-md text-primary">
                  Recent Uploads
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  History of imported master data files.
                </p>
              </div>
              <DataTable
                columns={UPLOAD_COLUMNS}
                rows={UPLOAD_HISTORY}
                theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="py-3 px-4 font-semibold border-b border-surface-border"
                rowClassName={(_, i) =>
                  cn(
                    "border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface",
                    i % 2 === 1 && "bg-neutral-50/50"
                  )
                }
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;

"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import {
  useAddApprovedEmail,
  useAdminUsers,
  useApprovedEmails,
  useDeleteApprovedEmail,
  useUpdateAdminUser,
} from "@/lib/hooks";
import type { AdminUserRow, ApiRole } from "@/lib/api-types";

type TabKey = "users" | "emails" | "upload";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "users", label: "Users & Roles", icon: "manage_accounts" },
  { key: "emails", label: "Approved Emails", icon: "alternate_email" },
  { key: "upload", label: "Master Data Upload", icon: "cloud_upload" },
];

/** Role options in API slug form (the per-row select PATCHes these values). */
const ROLE_OPTIONS: { value: ApiRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "company", label: "Company" },
  { value: "coordinator", label: "Coordinator" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;

/** "Aarav Sharma" → "AS". */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

/** Debounce a changing value (for search-as-you-type). */
function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-surface-variant rounded-lg", className)} />
);

const ErrorPanel = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
    <span className="text-body-md font-body-md text-status-error flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">error</span>
      {message}
    </span>
    <button
      onClick={onRetry}
      className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
    >
      Retry
    </button>
  </div>
);

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  // Users & Roles
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const usersQ = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    page,
  });
  const updateUser = useUpdateAdminUser();
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const users = usersQ.data?.items ?? [];
  const usersTotal = usersQ.data?.total ?? 0;
  const usersPageSize = usersQ.data?.pageSize ?? 20;
  const usersStart = usersTotal === 0 ? 0 : (page - 1) * usersPageSize + 1;
  const usersEnd = Math.min(page * usersPageSize, usersTotal);

  const changeRole = (u: AdminUserRow, role: string) => {
    setRowError(null);
    updateUser.mutate(
      { id: u.id, role },
      {
        onError: (err) => {
          const companyConflict =
            role === "company" &&
            err instanceof ApiError &&
            (err.status === 400 || err.status === 409);
          setRowError({
            id: u.id,
            message: companyConflict
              ? "Needs a company — provision via the recruiter flow instead."
              : err.message,
          });
        },
      }
    );
  };

  const setUserStatus = (u: AdminUserRow, status: "active" | "revoked") => {
    setRowError(null);
    updateUser.mutate(
      { id: u.id, status },
      { onError: (err) => setRowError({ id: u.id, message: err.message }) }
    );
  };

  // Approved Emails
  const emailsQ = useApprovedEmails();
  const addEmail = useAddApprovedEmail();
  const deleteEmail = useDeleteApprovedEmail();
  const [newKind, setNewKind] = useState<"exact" | "domain">("domain");
  const [newValue, setNewValue] = useState("");
  const [newRoleHint, setNewRoleHint] = useState("");

  const submitEmail = () => {
    const value = newValue.trim().toLowerCase();
    if (!value || addEmail.isPending) return;
    addEmail.mutate(
      { kind: newKind, value, roleHint: newRoleHint || undefined },
      { onSuccess: () => setNewValue("") }
    );
  };

  const USER_COLUMNS: Column<AdminUserRow>[] = [
    {
      header: "Name",
      className: "py-3 px-4",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-md font-label-md font-bold shrink-0">
            {initialsOf(u.fullName)}
          </div>
          <span className="font-medium text-text-primary">{u.fullName}</span>
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
      render: (u) => {
        const busy = updateUser.isPending && updateUser.variables?.id === u.id;
        return (
          <div>
            <select
              value={u.role}
              onChange={(e) => changeRole(u, e.target.value)}
              disabled={busy}
              aria-label={`Role for ${u.fullName}`}
              className="bg-surface-container-low border border-surface-border rounded-lg px-3 py-1.5 text-label-md font-label-md text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {rowError?.id === u.id && (
              <p className="text-label-sm font-label-sm text-status-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {rowError.message}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      className: "py-3 px-4",
      render: (u) =>
        u.status === "active" ? (
          <StatusBadge tone="success" icon="check_circle" bordered>
            Active
          </StatusBadge>
        ) : u.status === "revoked" ? (
          <StatusBadge tone="error" icon="block" bordered>
            Revoked
          </StatusBadge>
        ) : (
          <StatusBadge tone="warning" icon="hourglass_empty" bordered>
            Pending
          </StatusBadge>
        ),
    },
    {
      header: "Action",
      headerClassName: "text-right",
      className: "py-3 px-4 text-right",
      render: (u) => {
        const busy = updateUser.isPending && updateUser.variables?.id === u.id;
        if (u.status === "active") {
          return (
            <button
              onClick={() => setUserStatus(u, "revoked")}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              {busy && updateUser.variables?.status === "revoked" ? "Revoking…" : "Revoke"}
            </button>
          );
        }
        if (u.status === "revoked") {
          return (
            <button
              onClick={() => setUserStatus(u, "active")}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-status-success/30 text-status-success text-label-md font-label-md hover:bg-status-success/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              {busy && updateUser.variables?.status === "active" ? "Restoring…" : "Restore"}
            </button>
          );
        }
        return <span className="text-text-secondary">—</span>;
      },
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
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by role"
                    className="bg-surface-container-low border border-surface-border rounded-xl px-3 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">All roles</option>
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-full sm:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      search
                    </span>
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                      placeholder="Search by name or email..."
                      type="text"
                    />
                  </div>
                </div>
              </div>
              {usersQ.isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : usersQ.isError ? (
                <div className="p-5">
                  <ErrorPanel
                    message={usersQ.error?.message ?? "Failed to load users."}
                    onRetry={() => usersQ.refetch()}
                  />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] opacity-50">
                    person_search
                  </span>
                  <p className="text-title-md font-title-md mt-2">No users match your search</p>
                </div>
              ) : (
                <DataTable
                  columns={USER_COLUMNS}
                  rows={users}
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
              <div className="p-3 bg-surface-bright flex justify-between items-center text-label-sm text-text-secondary">
                <span>
                  Showing {usersStart}-{usersEnd} of {usersTotal} users
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                    disabled={page <= 1 || usersQ.isLoading}
                    aria-label="Previous page"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                    disabled={page * usersPageSize >= usersTotal || usersQ.isLoading}
                    aria-label="Next page"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_right
                    </span>
                  </button>
                </div>
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
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as "exact" | "domain")}
                    aria-label="Entry kind"
                    className="bg-surface-container-low border border-surface-border rounded-xl px-3 py-2.5 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="domain">Domain</option>
                    <option value="exact">Exact</option>
                  </select>
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      alternate_email
                    </span>
                    <input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitEmail();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                      placeholder={
                        newKind === "domain" ? "e.g. iitp.ac.in" : "e.g. name@iitp.ac.in"
                      }
                      type="text"
                    />
                  </div>
                  <select
                    value={newRoleHint}
                    onChange={(e) => setNewRoleHint(e.target.value)}
                    aria-label="Role hint (optional)"
                    className="bg-surface-container-low border border-surface-border rounded-xl px-3 py-2.5 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">No role hint</option>
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={submitEmail}
                    disabled={!newValue.trim() || addEmail.isPending}
                    className="btn-gradient text-on-primary px-5 py-2.5 rounded-lg text-title-md font-title-md shadow-sm hover-lift inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {addEmail.isPending ? "Adding…" : "Add"}
                  </button>
                </div>

                {addEmail.isError && (
                  <p className="text-label-sm font-label-sm text-status-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {addEmail.error.message}
                  </p>
                )}
                {deleteEmail.isError && (
                  <p className="text-label-sm font-label-sm text-status-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {deleteEmail.error.message}
                  </p>
                )}

                {emailsQ.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : emailsQ.isError ? (
                  <ErrorPanel
                    message={emailsQ.error?.message ?? "Failed to load the approved list."}
                    onRetry={() => emailsQ.refetch()}
                  />
                ) : (emailsQ.data?.length ?? 0) === 0 ? (
                  <div className="text-center py-10 text-text-secondary rounded-xl border border-surface-border">
                    <span className="material-symbols-outlined text-[36px] opacity-50">
                      alternate_email
                    </span>
                    <p className="text-title-md font-title-md mt-2">
                      No approved emails or domains yet
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
                    {emailsQ.data?.map((entry) => {
                      const removing =
                        deleteEmail.isPending && deleteEmail.variables === entry.id;
                      return (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="material-symbols-outlined text-primary text-[18px]">
                              {entry.kind === "domain" ? "domain" : "mail"}
                            </span>
                            <span className="text-body-md font-body-md text-text-primary truncate">
                              {entry.kind === "domain" ? `@${entry.value.replace(/^@/, "")}` : entry.value}
                            </span>
                            {entry.roleHint && (
                              <StatusBadge tone="info">{roleLabel(entry.roleHint)}</StatusBadge>
                            )}
                          </div>
                          <button
                            onClick={() => deleteEmail.mutate(entry.id)}
                            disabled={removing}
                            aria-label={`Remove ${entry.value}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors shrink-0 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {removing ? "hourglass_empty" : "close"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
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
                <div className="flex items-center justify-between gap-3">
                  <span className="text-label-sm font-label-sm text-text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Processing pipeline — phase 2
                  </span>
                  <button
                    disabled
                    className="btn-gradient text-on-primary px-6 py-2.5 rounded-lg text-title-md font-title-md shadow-sm inline-flex items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;

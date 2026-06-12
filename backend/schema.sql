-- =============================================================================
-- IIT Patna CCDC / TPC — PostgreSQL schema (DRAFT for review)
-- =============================================================================
-- Models the placement platform for five roles: student, company recruiter,
-- coordinator, admin, super-admin. Derived from the feature spec + the mock
-- data shapes currently in frontend-next/data/*.
--
-- CONVENTIONS
--   * PK            : uuid, default gen_random_uuid() (stable, opaque, shardable)
--   * Emails        : citext (case-insensitive uniqueness)
--   * Money         : numeric — *_lpa stored in lakhs/annum, stipend per month
--   * Time          : timestamptz everywhere; created_at / updated_at on mutable rows
--   * Soft state    : people are never hard-deleted — use users.status (revoked)
--                     and students.is_blocked rather than DELETE
--   * Enums         : native ENUM for small, stable sets; lookup TABLES for sets
--                     that grow or are edited in-app (programs, branches, skills)
--   * Season-scoped : most operational data hangs off placement_seasons
--   * Naming        : snake_case, singular column / plural table, *_id FKs
--
-- Read order: extensions -> enums -> lookups -> identity -> companies ->
--             drives -> applications -> credits -> calendar -> registration ->
--             logistics -> audit/admin -> notifications -> triggers -> indexes
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive emails


-- ----------------------------------------------------------------------------
-- 1. Enum types  (stable, app-wide vocabularies)
-- ----------------------------------------------------------------------------
create type user_role          as enum ('student','company','coordinator','admin','super_admin');
create type user_status        as enum ('active','revoked','pending');

create type placement_status   as enum ('unplaced','placed','higher_studies','opted_out','debarred');

create type drive_process_type as enum ('internship','six_month_fte','six_month_ppo','fte');
create type drive_status       as enum ('draft','pending_approval','open','closed','completed','cancelled');

create type stage_type         as enum ('registration','ppt','online_assessment','group_discussion','shortlisting','interview','offer');
create type stage_status       as enum ('upcoming','ongoing','completed','skipped');

create type application_status as enum ('applied','under_review','shortlisted','interview','offered','accepted','rejected','withdrawn');

create type event_type         as enum ('ppt','oa','interview','deadline','result','other');
create type event_scope        as enum ('global','branch','drive','personal');

create type contact_channel    as enum ('email','call','visit','other');
create type correction_status  as enum ('pending','approved','rejected');
create type registration_status as enum ('open','closed','pending');
create type document_type      as enum ('jd','result_sheet','instruction','offer_letter','other');

create type audit_action       as enum ('data_edit','export','role_change','login','logout',
                                         'policy','approval','credit_adjustment','upload','other');

create type approved_email_kind as enum ('exact','domain');
create type notification_category as enum ('drive','status','deadline','schedule','profile','system');

-- Forms engine (Google-Forms-style: companies/admins build forms, students fill).
create type form_kind       as enum ('registration','application','custom');
create type form_status     as enum ('draft','open','closed');
create type form_field_type as enum ('short_text','long_text','number','single_select','multi_select','date','time','file');


-- ----------------------------------------------------------------------------
-- 2. Reference / lookup tables
-- ----------------------------------------------------------------------------

-- Placement season / academic year. Most operational data is scoped to one.
create table placement_seasons (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,          -- e.g. '2024-25'
    starts_on   date,
    ends_on     date,
    is_active   boolean not null default false,
    created_at  timestamptz not null default now()
);

-- Degree programmes (B.Tech, M.Tech, PhD, Dual, M.Sc, ...). Lookup, not enum,
-- because the set is edited by admins via "master data upload".
create table programs (
    id          uuid primary key default gen_random_uuid(),
    code        text not null unique,          -- 'BTECH'
    name        text not null,                 -- 'Bachelor of Technology'
    duration_years smallint
);

-- Departments / branches (CSE, ECE, EE, ME, CE, Chemical, MME, ...).
create table branches (
    id          uuid primary key default gen_random_uuid(),
    code        text not null unique,          -- 'CSE'
    name        text not null                  -- 'Computer Science & Engineering'
);

-- Canonical skill vocabulary, shared by student profiles and drive requirements.
create table skills (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique
);


-- ----------------------------------------------------------------------------
-- 3. Identity & access
-- ----------------------------------------------------------------------------

-- Every human (any role) is a user. Auth is via Institute SSO / Microsoft OAuth,
-- so we store the external identity, never a password hash.
create table users (
    id            uuid primary key default gen_random_uuid(),
    email         citext not null unique,          -- official institute email = login
    role          user_role not null,
    status        user_status not null default 'active',
    full_name     text not null,
    auth_provider text,                            -- 'microsoft' | 'google' | ...
    external_id   text,                            -- subject id from the IdP
    last_login_at timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (auth_provider, external_id)
);

-- Student profile (1:1 with a user whose role = 'student').
--   LOCKED fields (admin-verified):   roll_no, program, branch, batch_year, cpi,
--                                     active_backlogs, btech_verified, placement_status
--   STUDENT-EDITABLE fields:          phone, alt_email, resume_url, linkedin_url,
--                                     github_url, preferred_location, + skills
-- Enforcement of "locked vs editable" is at the API layer; correction requests
-- (table below) are how students propose changes to locked fields.
create table students (
    id                 uuid primary key default gen_random_uuid(),
    user_id            uuid not null unique references users(id) on delete cascade,
    roll_no            text not null unique,            -- '2101CS02'
    program_id         uuid references programs(id),
    branch_id          uuid references branches(id),
    batch_year         smallint,                        -- graduating year
    cpi                numeric(4,2) check (cpi between 0 and 10),
    active_backlogs    smallint not null default 0,
    btech_verified     boolean not null default false,
    email_verified     boolean not null default false,
    placement_status   placement_status not null default 'unplaced',

    -- policy / restriction (admin + super-admin block/unblock)
    is_blocked         boolean not null default false,
    blocked_reason     text,

    -- credit ledger balance (denormalised; maintained by trigger from
    -- credit_transactions, which is the source of truth)
    credit_balance     integer not null default 0,

    -- student-editable contact block
    phone              text,
    alt_email          citext,
    resume_url         text,
    linkedin_url       text,
    github_url         text,
    preferred_location text,

    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

create table student_skills (
    student_id uuid not null references students(id) on delete cascade,
    skill_id   uuid not null references skills(id)   on delete cascade,
    primary key (student_id, skill_id)
);

-- Company (the recruiting org).
create table companies (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    slug        text unique,
    website     text,
    industry    text,
    logo_url    text,
    description text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Recruiter / HR user (1:1 user, belongs to one company).
create table recruiters (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null unique references users(id) on delete cascade,
    company_id  uuid not null references companies(id)     on delete restrict,
    designation text,
    phone       text,
    created_at  timestamptz not null default now()
);

-- Coordinator profile (1:1 user, role = 'coordinator').
create table coordinators (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null unique references users(id) on delete cascade,
    department  text,
    phone       text,
    created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 4. Companies — points of contact & contact log (admin "Company Contacts")
-- ----------------------------------------------------------------------------

-- Named POCs for a company (for quick communication on the recruiter dashboard).
create table company_pocs (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references companies(id) on delete cascade,
    name        text not null,
    designation text,
    phone       text,
    email       citext,
    is_primary  boolean not null default false,
    created_at  timestamptz not null default now()
);

-- Admin-maintained history of who last contacted the company and when.
-- "Last contacted" = the most recent row by contacted_on.
create table company_contact_log (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references companies(id) on delete cascade,
    contact_name  text not null,
    designation   text,
    channel       contact_channel not null default 'email',
    note          text,
    contacted_on  date not null,
    recorded_by   uuid references users(id) on delete set null,
    created_at    timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 5. Drives / Job Announcements (JAF + coordinator "Add Drive")
-- ----------------------------------------------------------------------------
-- A drive is one role opening from one company in one season. Created by a
-- recruiter (JAF) or a coordinator (Add Drive); approved by TPC staff.
create table drives (
    id                 uuid primary key default gen_random_uuid(),
    season_id          uuid not null references placement_seasons(id) on delete restrict,
    company_id         uuid not null references companies(id)         on delete restrict,
    created_by         uuid references users(id) on delete set null,

    title              text not null,                    -- 'Software Development Engineer'
    description        text,
    process_type       drive_process_type not null,
    location           text,

    ctc_lpa            numeric(7,2),                      -- total CTC in LPA
    stipend_per_month  numeric(10,2),

    -- eligibility (branches/programs via join tables below)
    min_cpi            numeric(4,2) check (min_cpi between 0 and 10),
    allow_backlog      boolean not null default false,
    custom_rules       text,

    status             drive_status not null default 'draft',
    application_deadline timestamptz,

    approved_by        uuid references users(id) on delete set null,
    approved_at        timestamptz,

    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

create table drive_eligible_branches (
    drive_id  uuid not null references drives(id)   on delete cascade,
    branch_id uuid not null references branches(id) on delete cascade,
    primary key (drive_id, branch_id)
);

create table drive_eligible_programs (
    drive_id   uuid not null references drives(id)    on delete cascade,
    program_id uuid not null references programs(id)  on delete cascade,
    primary key (drive_id, program_id)
);

-- Display tags / required skills shown on the drive card.
create table drive_skills (
    drive_id uuid not null references drives(id)  on delete cascade,
    skill_id uuid not null references skills(id)  on delete cascade,
    primary key (drive_id, skill_id)
);

-- Process pipeline (workspace Tab A) AND the timeline dates in one place.
-- e.g. registration / oa / shortlisting / interview / offer, each with a date.
create table drive_stages (
    id             uuid primary key default gen_random_uuid(),
    drive_id       uuid not null references drives(id) on delete cascade,
    type           stage_type not null,
    label          text,                              -- override display name
    sequence       smallint not null,                 -- ordering
    status         stage_status not null default 'upcoming',
    scheduled_at   timestamptz,
    location       text,
    unique (drive_id, sequence)
);

-- JD / result sheets / instructions / offer letters attached to a drive.
create table drive_documents (
    id          uuid primary key default gen_random_uuid(),
    drive_id    uuid not null references drives(id) on delete cascade,
    type        document_type not null,
    name        text not null,
    file_url    text not null,
    uploaded_by uuid references users(id) on delete set null,
    uploaded_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 6. Applications, status history, offers
-- ----------------------------------------------------------------------------
create table applications (
    id            uuid primary key default gen_random_uuid(),
    drive_id      uuid not null references drives(id)   on delete cascade,
    student_id    uuid not null references students(id) on delete cascade,
    status        application_status not null default 'applied',
    is_shortlisted boolean not null default false,
    current_stage_id uuid references drive_stages(id) on delete set null,
    form_response_id uuid,                              -- application questionnaire (FK added in §10)
    applied_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (drive_id, student_id)                       -- one application per drive
);

create table application_status_history (
    id             uuid primary key default gen_random_uuid(),
    application_id uuid not null references applications(id) on delete cascade,
    status         application_status not null,
    note           text,
    changed_by     uuid references users(id) on delete set null,
    created_at     timestamptz not null default now()
);

create table offers (
    id             uuid primary key default gen_random_uuid(),
    application_id uuid not null unique references applications(id) on delete cascade,
    role_title     text,
    offer_type     drive_process_type,
    ctc_lpa        numeric(7,2),
    offered_at     timestamptz not null default now(),
    accepted       boolean,
    responded_at   timestamptz
);


-- ----------------------------------------------------------------------------
-- 6b. Drive eligibility cache  (precomputed per student × drive)
-- ----------------------------------------------------------------------------
-- Materialised eligibility so the catalogue never recomputes rules (min_cpi,
-- branch, program, backlog) per request — fewer joins at scale, and the raw
-- rule evaluation isn't exposed to the client. Refreshed by a background job
-- when a drive's eligibility rules change or a student's academic record changes.
create table drive_eligibility (
    drive_id    uuid not null references drives(id)   on delete cascade,
    student_id  uuid not null references students(id) on delete cascade,
    is_eligible boolean not null,
    reasons     text[],                  -- ineligibility reasons (empty when eligible)
    computed_at timestamptz not null default now(),
    primary key (drive_id, student_id)
);


-- ----------------------------------------------------------------------------
-- 7. Credits  (admin "Credit Management")  — append-only ledger
-- ----------------------------------------------------------------------------
-- Each adjustment (+/-) is one row with a mandatory reason. students.credit_balance
-- is kept in sync by trigger; balance_after snapshots the running total.
create table credit_transactions (
    id            uuid primary key default gen_random_uuid(),
    student_id    uuid not null references students(id) on delete cascade,
    season_id     uuid references placement_seasons(id) on delete set null,
    delta         integer not null,                    -- + grant, - deduction
    balance_after integer,                              -- set by trigger
    reason        text not null,
    created_by    uuid references users(id) on delete set null,
    created_at    timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 8. Data correction requests (student "My Profile" -> locked-field changes)
-- ----------------------------------------------------------------------------
create table data_correction_requests (
    id              uuid primary key default gen_random_uuid(),
    student_id      uuid not null references students(id) on delete cascade,
    field_name      text not null,                     -- 'cpi', 'branch', ...
    current_value   text,
    requested_value text,
    reason          text,
    status          correction_status not null default 'pending',
    reviewed_by     uuid references users(id) on delete set null,
    reviewed_at     timestamptz,
    created_at      timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 9. Calendar / events
-- ----------------------------------------------------------------------------
-- One table serves student PPT/OA/Interview/Deadline/Result events, drive-linked
-- events, and student-added personal events. Scope controls visibility:
--   global   -> everyone in the season
--   branch   -> only listed branches (event_branches)
--   drive    -> tied to a drive (audience derived from drive eligibility)
--   personal -> only owner_user_id (student's own added event)
create table events (
    id            uuid primary key default gen_random_uuid(),
    season_id     uuid references placement_seasons(id) on delete cascade,
    type          event_type not null,
    scope         event_scope not null default 'global',
    title         text not null,
    detail        text,
    event_date    date not null,
    start_time    time,
    end_time      time,
    location      text,
    drive_id      uuid references drives(id) on delete cascade,
    owner_user_id uuid references users(id)  on delete cascade,   -- personal events
    created_by    uuid references users(id)  on delete set null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- Branch targeting for scope = 'branch' (super-admin can see all branches at once).
create table event_branches (
    event_id  uuid not null references events(id)   on delete cascade,
    branch_id uuid not null references branches(id) on delete cascade,
    primary key (event_id, branch_id)
);


-- ----------------------------------------------------------------------------
-- 10. Forms engine  (Google-Forms-style builder)
-- ----------------------------------------------------------------------------
-- One unified engine powers: company-created custom forms (kind='custom'), the
-- admin company-registration questionnaire (kind='registration'), and drive
-- application questionnaires (kind='application'). All responses live in
-- form_responses / form_answers regardless of which feature created the form.
create table forms (
    id             uuid primary key default gen_random_uuid(),
    kind           form_kind not null default 'custom',
    title          text not null,
    description    text,
    status         form_status not null default 'draft',
    season_id      uuid references placement_seasons(id) on delete set null,
    company_id     uuid references companies(id) on delete cascade,   -- owning company (custom/registration)
    drive_id       uuid references drives(id)    on delete cascade,   -- application questionnaire
    created_by     uuid references users(id)     on delete set null,
    opens_at       timestamptz,
    closes_at      timestamptz,
    allow_multiple boolean not null default false,                    -- >1 response per student?
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Ordered questions. Type-specific settings (min/max, accepted file types, max
-- selections, ...) live in `config` jsonb; choices live in form_field_options.
create table form_fields (
    id          uuid primary key default gen_random_uuid(),
    form_id     uuid not null references forms(id) on delete cascade,
    label       text not null,
    help_text   text,
    type        form_field_type not null,
    is_required boolean not null default false,
    position    smallint not null,
    config      jsonb not null default '{}',
    unique (form_id, position)
);

-- Choices for single_select / multi_select fields.
create table form_field_options (
    id        uuid primary key default gen_random_uuid(),
    field_id  uuid not null references form_fields(id) on delete cascade,
    label     text not null,
    value     text,
    position  smallint not null,
    unique (field_id, position)
);

-- One submission of a form (one per student unless forms.allow_multiple).
create table form_responses (
    id            uuid primary key default gen_random_uuid(),
    form_id       uuid not null references forms(id) on delete cascade,
    student_id    uuid references students(id) on delete cascade,
    respondent_id uuid references users(id)    on delete set null,   -- whoever submitted
    submitted_at  timestamptz not null default now()
);

-- One answer per (response, field). Typed value columns + file_url; a single
-- choice is selected_option_id, multiple choices use form_answer_options.
create table form_answers (
    id                 uuid primary key default gen_random_uuid(),
    response_id        uuid not null references form_responses(id) on delete cascade,
    field_id           uuid not null references form_fields(id)    on delete cascade,
    value_text         text,
    value_number       numeric,
    value_date         date,
    value_time         time,
    file_url           text,
    selected_option_id uuid references form_field_options(id) on delete set null,
    unique (response_id, field_id)
);

create table form_answer_options (
    answer_id uuid not null references form_answers(id)       on delete cascade,
    option_id uuid not null references form_field_options(id) on delete cascade,
    primary key (answer_id, option_id)
);

-- Drive application questionnaire link (applications declared in §6).
alter table applications
    add constraint fk_applications_form_response
    foreign key (form_response_id) references form_responses(id) on delete set null;


-- ----------------------------------------------------------------------------
-- 10b. Company registration for a season (admin "Manage Companies")
-- ----------------------------------------------------------------------------
-- Registration metadata + predefined eligibility. The questionnaire students
-- fill is a form (kind='registration') referenced by form_id, so responses live
-- in form_responses / form_answers — no bespoke responses table.
create table company_registrations (
    id                    uuid primary key default gen_random_uuid(),
    season_id             uuid not null references placement_seasons(id) on delete cascade,
    company_id            uuid references companies(id) on delete set null,
    company_name          text not null,                -- free text until company row exists
    industry              text,
    process_type          drive_process_type,
    min_cpi               numeric(4,2) check (min_cpi between 0 and 10),
    registration_deadline date,
    status                registration_status not null default 'open',
    form_id               uuid references forms(id) on delete set null,
    created_by            uuid references users(id) on delete set null,
    created_at            timestamptz not null default now()
);

create table registration_eligible_branches (
    registration_id uuid not null references company_registrations(id) on delete cascade,
    branch_id       uuid not null references branches(id)              on delete cascade,
    primary key (registration_id, branch_id)
);


-- ----------------------------------------------------------------------------
-- 11. Logistics (recruiter "Logistics")
-- ----------------------------------------------------------------------------
create table logistics_requests (
    id                   uuid primary key default gen_random_uuid(),
    drive_id             uuid references drives(id)        on delete cascade,
    company_id           uuid not null references companies(id) on delete cascade,
    season_id            uuid references placement_seasons(id)  on delete set null,

    -- hospitality & dietary
    accommodation_required boolean not null default false,
    rooms_required       smallint,
    check_in             date,
    check_out            date,
    dietary_preference   text,
    special_requests     text,

    -- technical & venue
    venue_preference     text,
    systems_required     smallint,
    projector_required   boolean not null default false,
    internet_required    boolean not null default false,
    technical_notes      text,

    status               text not null default 'draft',     -- draft|submitted|confirmed
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

create table visiting_team_members (
    id                   uuid primary key default gen_random_uuid(),
    logistics_request_id uuid not null references logistics_requests(id) on delete cascade,
    name                 text not null,
    designation          text,
    phone                text,
    email                citext
);


-- ----------------------------------------------------------------------------
-- 12. Coordinator assignments  (which companies/drives a coordinator owns)
-- ----------------------------------------------------------------------------
-- Per-drive ownership: a coordinator is assigned to a specific drive, so a
-- company running several roles can be split across coordinators. The season is
-- derived from the drive.
create table coordinator_assignments (
    id             uuid primary key default gen_random_uuid(),
    coordinator_id uuid not null references coordinators(id) on delete cascade,
    drive_id       uuid not null references drives(id)       on delete cascade,
    assigned_at    timestamptz not null default now(),
    unique (coordinator_id, drive_id)
);


-- ----------------------------------------------------------------------------
-- 13. Super-admin: access control, approved emails, master data, audit log
-- ----------------------------------------------------------------------------

-- Allow-list of institute emails / domains permitted to sign in.
create table approved_emails (
    id          uuid primary key default gen_random_uuid(),
    kind        approved_email_kind not null default 'exact',
    value       citext not null unique,        -- 'web_ccdc@iitp.ac.in' or 'iitp.ac.in'
    role_hint   user_role,                     -- optional default role on first login
    added_by    uuid references users(id) on delete set null,
    created_at  timestamptz not null default now()
);

-- Master-data bulk uploads (student rosters, etc.).
create table master_data_uploads (
    id          uuid primary key default gen_random_uuid(),
    file_name   text not null,
    kind        text,                          -- 'students' | 'companies' | ...
    row_count   integer,
    status      text not null default 'processed',
    uploaded_by uuid references users(id) on delete set null,
    uploaded_at timestamptz not null default now()
);

-- Read-only audit trail of every sensitive action (edits, exports, role changes,
-- logins, policy actions). Actor kept via SET NULL so logs survive user removal.
create table audit_logs (
    id           uuid primary key default gen_random_uuid(),
    actor_id     uuid references users(id) on delete set null,
    actor_role   user_role,                    -- snapshot at action time
    action       audit_action not null,
    target_table text,
    target_id    uuid,
    target_label text,                         -- human-readable target snapshot
    details      text,
    ip_address   inet,
    created_at   timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 14. Notifications  (spec marks this "later" — included for completeness)
-- ----------------------------------------------------------------------------
create table notifications (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references users(id) on delete cascade,
    category    notification_category not null,
    title       text not null,
    message     text,
    link        text,
    is_read     boolean not null default false,
    created_at  timestamptz not null default now()
);

create table notification_preferences (
    user_id   uuid not null references users(id) on delete cascade,
    category  notification_category not null,
    enabled   boolean not null default true,
    primary key (user_id, category)
);


-- ----------------------------------------------------------------------------
-- 15. Triggers
-- ----------------------------------------------------------------------------

-- 15.1 updated_at maintenance
create or replace function set_updated_at() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_users_updated      before update on users      for each row execute function set_updated_at();
create trigger trg_students_updated   before update on students   for each row execute function set_updated_at();
create trigger trg_companies_updated  before update on companies  for each row execute function set_updated_at();
create trigger trg_drives_updated     before update on drives     for each row execute function set_updated_at();
create trigger trg_applications_updated before update on applications for each row execute function set_updated_at();
create trigger trg_events_updated     before update on events     for each row execute function set_updated_at();
create trigger trg_logistics_updated  before update on logistics_requests for each row execute function set_updated_at();
create trigger trg_forms_updated      before update on forms      for each row execute function set_updated_at();

-- 15.2 credit ledger -> keep students.credit_balance + balance_after in sync
create or replace function apply_credit_transaction() returns trigger as $$
begin
    update students
       set credit_balance = credit_balance + new.delta,
           updated_at     = now()
     where id = new.student_id;

    select credit_balance into new.balance_after
      from students where id = new.student_id;

    return new;
end;
$$ language plpgsql;

create trigger trg_credit_apply
    before insert on credit_transactions
    for each row execute function apply_credit_transaction();


-- ----------------------------------------------------------------------------
-- 16. Indexes  (FK lookups + common filters; PK/unique already indexed)
-- ----------------------------------------------------------------------------
create index idx_users_role               on users(role);
create index idx_students_branch          on students(branch_id);
create index idx_students_placement       on students(placement_status);
create index idx_student_skills_skill     on student_skills(skill_id);

create index idx_recruiters_company       on recruiters(company_id);
create index idx_company_pocs_company      on company_pocs(company_id);
create index idx_contactlog_company_date   on company_contact_log(company_id, contacted_on desc);

create index idx_drives_season            on drives(season_id);
create index idx_drives_company           on drives(company_id);
create index idx_drives_status            on drives(status);
create index idx_drive_stages_drive       on drive_stages(drive_id);
create index idx_drive_docs_drive         on drive_documents(drive_id);

create index idx_applications_drive       on applications(drive_id);
create index idx_applications_student     on applications(student_id);
create index idx_applications_status      on applications(status);
create index idx_appstatus_application    on application_status_history(application_id);

create index idx_credit_tx_student        on credit_transactions(student_id, created_at desc);
create index idx_correction_student       on data_correction_requests(student_id);
create index idx_correction_status        on data_correction_requests(status);

create index idx_events_season_date       on events(season_id, event_date);
create index idx_events_drive             on events(drive_id);
create index idx_events_owner             on events(owner_user_id);

create index idx_drive_eligibility_student on drive_eligibility(student_id);

create index idx_forms_company            on forms(company_id);
create index idx_forms_drive              on forms(drive_id);
create index idx_form_fields_form         on form_fields(form_id);
create index idx_form_responses_form      on form_responses(form_id);
create index idx_form_responses_student   on form_responses(student_id);
create index idx_form_answers_response    on form_answers(response_id);
create index idx_company_registrations_form on company_registrations(form_id);

create index idx_coord_assign_coordinator on coordinator_assignments(coordinator_id);
create index idx_coord_assign_drive       on coordinator_assignments(drive_id);
create index idx_audit_actor_time         on audit_logs(actor_id, created_at desc);
create index idx_audit_action_time        on audit_logs(action, created_at desc);
create index idx_notifications_user_unread on notifications(user_id, is_read, created_at desc);

-- =============================================================================
-- End of schema
-- =============================================================================

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('student', 'company', 'coordinator', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'revoked', 'pending');

-- CreateEnum
CREATE TYPE "placement_status" AS ENUM ('unplaced', 'placed', 'higher_studies', 'opted_out', 'debarred');

-- CreateEnum
CREATE TYPE "drive_process_type" AS ENUM ('internship', 'six_month_fte', 'six_month_ppo', 'fte');

-- CreateEnum
CREATE TYPE "drive_status" AS ENUM ('draft', 'pending_approval', 'open', 'closed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "stage_type" AS ENUM ('registration', 'ppt', 'online_assessment', 'group_discussion', 'shortlisting', 'interview', 'offer');

-- CreateEnum
CREATE TYPE "stage_status" AS ENUM ('upcoming', 'ongoing', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('applied', 'under_review', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('ppt', 'oa', 'interview', 'deadline', 'result', 'other');

-- CreateEnum
CREATE TYPE "event_scope" AS ENUM ('global', 'branch', 'drive', 'personal');

-- CreateEnum
CREATE TYPE "contact_channel" AS ENUM ('email', 'call', 'visit', 'other');

-- CreateEnum
CREATE TYPE "correction_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('open', 'closed', 'pending');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('jd', 'result_sheet', 'instruction', 'offer_letter', 'other');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('data_edit', 'export', 'role_change', 'login', 'logout', 'policy', 'approval', 'credit_adjustment', 'upload', 'other');

-- CreateEnum
CREATE TYPE "approved_email_kind" AS ENUM ('exact', 'domain');

-- CreateEnum
CREATE TYPE "notification_category" AS ENUM ('drive', 'status', 'deadline', 'schedule', 'profile', 'system');

-- CreateEnum
CREATE TYPE "form_kind" AS ENUM ('registration', 'application', 'custom');

-- CreateEnum
CREATE TYPE "form_status" AS ENUM ('draft', 'open', 'closed');

-- CreateEnum
CREATE TYPE "form_field_type" AS ENUM ('short_text', 'long_text', 'number', 'single_select', 'multi_select', 'date', 'time', 'file');

-- CreateTable
CREATE TABLE "placement_seasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "starts_on" DATE,
    "ends_on" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_years" SMALLINT,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "full_name" TEXT NOT NULL,
    "auth_provider" TEXT,
    "external_id" TEXT,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "roll_no" TEXT NOT NULL,
    "program_id" UUID,
    "branch_id" UUID,
    "batch_year" SMALLINT,
    "cpi" DECIMAL(4,2),
    "active_backlogs" SMALLINT NOT NULL DEFAULT 0,
    "btech_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "placement_status" "placement_status" NOT NULL DEFAULT 'unplaced',
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_reason" TEXT,
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "alt_email" CITEXT,
    "resume_url" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "preferred_location" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "student_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("student_id","skill_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "department" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_pocs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "email" CITEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_pocs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contact_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "contact_name" TEXT NOT NULL,
    "designation" TEXT,
    "channel" "contact_channel" NOT NULL DEFAULT 'email',
    "note" TEXT,
    "contacted_on" DATE NOT NULL,
    "recorded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_contact_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "season_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_by" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "process_type" "drive_process_type" NOT NULL,
    "location" TEXT,
    "ctc_lpa" DECIMAL(7,2),
    "stipend_per_month" DECIMAL(10,2),
    "min_cpi" DECIMAL(4,2),
    "allow_backlog" BOOLEAN NOT NULL DEFAULT false,
    "custom_rules" TEXT,
    "status" "drive_status" NOT NULL DEFAULT 'draft',
    "application_deadline" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_eligible_branches" (
    "drive_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,

    CONSTRAINT "drive_eligible_branches_pkey" PRIMARY KEY ("drive_id","branch_id")
);

-- CreateTable
CREATE TABLE "drive_eligible_programs" (
    "drive_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,

    CONSTRAINT "drive_eligible_programs_pkey" PRIMARY KEY ("drive_id","program_id")
);

-- CreateTable
CREATE TABLE "drive_skills" (
    "drive_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "drive_skills_pkey" PRIMARY KEY ("drive_id","skill_id")
);

-- CreateTable
CREATE TABLE "drive_stages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "type" "stage_type" NOT NULL,
    "label" TEXT,
    "sequence" SMALLINT NOT NULL,
    "status" "stage_status" NOT NULL DEFAULT 'upcoming',
    "scheduled_at" TIMESTAMPTZ(6),
    "location" TEXT,

    CONSTRAINT "drive_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "type" "document_type" NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'applied',
    "is_shortlisted" BOOLEAN NOT NULL DEFAULT false,
    "current_stage_id" UUID,
    "form_response_id" UUID,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "status" "application_status" NOT NULL,
    "note" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "role_title" TEXT,
    "offer_type" "drive_process_type",
    "ctc_lpa" DECIMAL(7,2),
    "offered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted" BOOLEAN,
    "responded_at" TIMESTAMPTZ(6),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_eligibility" (
    "drive_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "is_eligible" BOOLEAN NOT NULL,
    "reasons" TEXT[],
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_eligibility_pkey" PRIMARY KEY ("drive_id","student_id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "season_id" UUID,
    "delta" INTEGER NOT NULL,
    "balance_after" INTEGER,
    "reason" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_correction_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL,
    "current_value" TEXT,
    "requested_value" TEXT,
    "reason" TEXT,
    "status" "correction_status" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "season_id" UUID,
    "type" "event_type" NOT NULL,
    "scope" "event_scope" NOT NULL DEFAULT 'global',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "event_date" DATE NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "location" TEXT,
    "drive_id" UUID,
    "owner_user_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_branches" (
    "event_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,

    CONSTRAINT "event_branches_pkey" PRIMARY KEY ("event_id","branch_id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "form_kind" NOT NULL DEFAULT 'custom',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "form_status" NOT NULL DEFAULT 'draft',
    "season_id" UUID,
    "company_id" UUID,
    "drive_id" UUID,
    "created_by" UUID,
    "opens_at" TIMESTAMPTZ(6),
    "closes_at" TIMESTAMPTZ(6),
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "form_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "help_text" TEXT,
    "type" "form_field_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "position" SMALLINT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "field_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "form_field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "form_id" UUID NOT NULL,
    "student_id" UUID,
    "respondent_id" UUID,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "response_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "value_text" TEXT,
    "value_number" DECIMAL,
    "value_date" DATE,
    "value_time" TIME(6),
    "file_url" TEXT,
    "selected_option_id" UUID,

    CONSTRAINT "form_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_answer_options" (
    "answer_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,

    CONSTRAINT "form_answer_options_pkey" PRIMARY KEY ("answer_id","option_id")
);

-- CreateTable
CREATE TABLE "company_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "season_id" UUID NOT NULL,
    "company_id" UUID,
    "company_name" TEXT NOT NULL,
    "industry" TEXT,
    "process_type" "drive_process_type",
    "min_cpi" DECIMAL(4,2),
    "registration_deadline" DATE,
    "status" "registration_status" NOT NULL DEFAULT 'open',
    "form_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_eligible_branches" (
    "registration_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,

    CONSTRAINT "registration_eligible_branches_pkey" PRIMARY KEY ("registration_id","branch_id")
);

-- CreateTable
CREATE TABLE "logistics_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID,
    "company_id" UUID NOT NULL,
    "season_id" UUID,
    "accommodation_required" BOOLEAN NOT NULL DEFAULT false,
    "rooms_required" SMALLINT,
    "check_in" DATE,
    "check_out" DATE,
    "dietary_preference" TEXT,
    "special_requests" TEXT,
    "venue_preference" TEXT,
    "systems_required" SMALLINT,
    "projector_required" BOOLEAN NOT NULL DEFAULT false,
    "internet_required" BOOLEAN NOT NULL DEFAULT false,
    "technical_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "logistics_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visiting_team_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "logistics_request_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "email" CITEXT,

    CONSTRAINT "visiting_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coordinator_id" UUID NOT NULL,
    "drive_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordinator_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approved_emails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "approved_email_kind" NOT NULL DEFAULT 'exact',
    "value" CITEXT NOT NULL,
    "role_hint" "user_role",
    "added_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approved_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_uploads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_name" TEXT NOT NULL,
    "kind" TEXT,
    "row_count" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "actor_role" "user_role",
    "action" "audit_action" NOT NULL,
    "target_table" TEXT,
    "target_id" UUID,
    "target_label" TEXT,
    "details" TEXT,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" "notification_category" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" UUID NOT NULL,
    "category" "notification_category" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id","category")
);

-- CreateIndex
CREATE UNIQUE INDEX "placement_seasons_name_key" ON "placement_seasons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_external_id_key" ON "users"("auth_provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_roll_no_key" ON "students"("roll_no");

-- CreateIndex
CREATE INDEX "idx_students_branch" ON "students"("branch_id");

-- CreateIndex
CREATE INDEX "idx_students_placement" ON "students"("placement_status");

-- CreateIndex
CREATE INDEX "idx_student_skills_skill" ON "student_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "recruiters_user_id_key" ON "recruiters"("user_id");

-- CreateIndex
CREATE INDEX "idx_recruiters_company" ON "recruiters"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "coordinators_user_id_key" ON "coordinators"("user_id");

-- CreateIndex
CREATE INDEX "idx_company_pocs_company" ON "company_pocs"("company_id");

-- CreateIndex
CREATE INDEX "idx_contactlog_company_date" ON "company_contact_log"("company_id", "contacted_on" DESC);

-- CreateIndex
CREATE INDEX "idx_drives_season" ON "drives"("season_id");

-- CreateIndex
CREATE INDEX "idx_drives_company" ON "drives"("company_id");

-- CreateIndex
CREATE INDEX "idx_drives_status" ON "drives"("status");

-- CreateIndex
CREATE INDEX "idx_drive_stages_drive" ON "drive_stages"("drive_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_stages_drive_id_sequence_key" ON "drive_stages"("drive_id", "sequence");

-- CreateIndex
CREATE INDEX "idx_drive_docs_drive" ON "drive_documents"("drive_id");

-- CreateIndex
CREATE INDEX "idx_applications_drive" ON "applications"("drive_id");

-- CreateIndex
CREATE INDEX "idx_applications_student" ON "applications"("student_id");

-- CreateIndex
CREATE INDEX "idx_applications_status" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_drive_id_student_id_key" ON "applications"("drive_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_appstatus_application" ON "application_status_history"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "offers_application_id_key" ON "offers"("application_id");

-- CreateIndex
CREATE INDEX "idx_drive_eligibility_student" ON "drive_eligibility"("student_id");

-- CreateIndex
CREATE INDEX "idx_credit_tx_student" ON "credit_transactions"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_correction_student" ON "data_correction_requests"("student_id");

-- CreateIndex
CREATE INDEX "idx_correction_status" ON "data_correction_requests"("status");

-- CreateIndex
CREATE INDEX "idx_events_season_date" ON "events"("season_id", "event_date");

-- CreateIndex
CREATE INDEX "idx_events_drive" ON "events"("drive_id");

-- CreateIndex
CREATE INDEX "idx_events_owner" ON "events"("owner_user_id");

-- CreateIndex
CREATE INDEX "idx_forms_company" ON "forms"("company_id");

-- CreateIndex
CREATE INDEX "idx_forms_drive" ON "forms"("drive_id");

-- CreateIndex
CREATE INDEX "idx_form_fields_form" ON "form_fields"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_form_id_position_key" ON "form_fields"("form_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "form_field_options_field_id_position_key" ON "form_field_options"("field_id", "position");

-- CreateIndex
CREATE INDEX "idx_form_responses_form" ON "form_responses"("form_id");

-- CreateIndex
CREATE INDEX "idx_form_responses_student" ON "form_responses"("student_id");

-- CreateIndex
CREATE INDEX "idx_form_answers_response" ON "form_answers"("response_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_answers_response_id_field_id_key" ON "form_answers"("response_id", "field_id");

-- CreateIndex
CREATE INDEX "idx_company_registrations_form" ON "company_registrations"("form_id");

-- CreateIndex
CREATE INDEX "idx_coord_assign_coordinator" ON "coordinator_assignments"("coordinator_id");

-- CreateIndex
CREATE INDEX "idx_coord_assign_drive" ON "coordinator_assignments"("drive_id");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_assignments_coordinator_id_drive_id_key" ON "coordinator_assignments"("coordinator_id", "drive_id");

-- CreateIndex
CREATE UNIQUE INDEX "approved_emails_value_key" ON "approved_emails"("value");

-- CreateIndex
CREATE INDEX "idx_audit_actor_time" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_action_time" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiters" ADD CONSTRAINT "recruiters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiters" ADD CONSTRAINT "recruiters_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinators" ADD CONSTRAINT "coordinators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_pocs" ADD CONSTRAINT "company_pocs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contact_log" ADD CONSTRAINT "company_contact_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contact_log" ADD CONSTRAINT "company_contact_log_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drives" ADD CONSTRAINT "drives_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "placement_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drives" ADD CONSTRAINT "drives_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drives" ADD CONSTRAINT "drives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drives" ADD CONSTRAINT "drives_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_eligible_branches" ADD CONSTRAINT "drive_eligible_branches_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_eligible_branches" ADD CONSTRAINT "drive_eligible_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_eligible_programs" ADD CONSTRAINT "drive_eligible_programs_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_eligible_programs" ADD CONSTRAINT "drive_eligible_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_skills" ADD CONSTRAINT "drive_skills_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_skills" ADD CONSTRAINT "drive_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_stages" ADD CONSTRAINT "drive_stages_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_documents" ADD CONSTRAINT "drive_documents_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_documents" ADD CONSTRAINT "drive_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "drive_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_form_response_id_fkey" FOREIGN KEY ("form_response_id") REFERENCES "form_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_eligibility" ADD CONSTRAINT "drive_eligibility_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_eligibility" ADD CONSTRAINT "drive_eligibility_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "placement_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_correction_requests" ADD CONSTRAINT "data_correction_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_correction_requests" ADD CONSTRAINT "data_correction_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "placement_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_branches" ADD CONSTRAINT "event_branches_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_branches" ADD CONSTRAINT "event_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "placement_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_options" ADD CONSTRAINT "form_field_options_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "form_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "form_field_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answer_options" ADD CONSTRAINT "form_answer_options_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "form_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answer_options" ADD CONSTRAINT "form_answer_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "form_field_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "placement_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_eligible_branches" ADD CONSTRAINT "registration_eligible_branches_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "company_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_eligible_branches" ADD CONSTRAINT "registration_eligible_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "placement_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visiting_team_members" ADD CONSTRAINT "visiting_team_members_logistics_request_id_fkey" FOREIGN KEY ("logistics_request_id") REFERENCES "logistics_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_assignments" ADD CONSTRAINT "coordinator_assignments_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_assignments" ADD CONSTRAINT "coordinator_assignments_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approved_emails" ADD CONSTRAINT "approved_emails_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_data_uploads" ADD CONSTRAINT "master_data_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

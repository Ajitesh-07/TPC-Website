-- AlterTable
ALTER TABLE "form_fields" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb;

-- CreateTable
CREATE TABLE "registration_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "registration_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_reg_responses_reg" ON "registration_responses"("registration_id");

-- CreateIndex
CREATE INDEX "idx_reg_responses_student" ON "registration_responses"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_responses_registration_id_student_id_key" ON "registration_responses"("registration_id", "student_id");

-- AddForeignKey
ALTER TABLE "registration_responses" ADD CONSTRAINT "registration_responses_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "company_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_responses" ADD CONSTRAINT "registration_responses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

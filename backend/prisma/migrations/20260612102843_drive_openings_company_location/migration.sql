-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "drives" ADD COLUMN     "openings" INTEGER;

-- AlterTable
ALTER TABLE "form_fields" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb;

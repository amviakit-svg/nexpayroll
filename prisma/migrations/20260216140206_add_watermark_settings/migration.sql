-- AlterTable
ALTER TABLE "TenantConfig" ADD COLUMN     "watermarkEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watermarkText" TEXT NOT NULL DEFAULT 'NexPayroll';

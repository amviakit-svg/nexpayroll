-- AlterTable
ALTER TABLE "SalaryComponent" ADD COLUMN "isVariable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PayrollLineItem"
  ADD COLUMN "componentNameSnapshot" TEXT,
  ADD COLUMN "componentTypeSnapshot" "ComponentType",
  ADD COLUMN "isVariableAdjustment" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "componentId" DROP NOT NULL;

-- Backfill snapshot columns from existing component relation
UPDATE "PayrollLineItem" pli
SET "componentNameSnapshot" = sc."name",
    "componentTypeSnapshot" = sc."type"
FROM "SalaryComponent" sc
WHERE pli."componentId" = sc."id";

-- Ensure no nulls remain
UPDATE "PayrollLineItem" SET "componentNameSnapshot" = 'Unknown Component' WHERE "componentNameSnapshot" IS NULL;
UPDATE "PayrollLineItem" SET "componentTypeSnapshot" = 'EARNING' WHERE "componentTypeSnapshot" IS NULL;

-- Make snapshot columns required
ALTER TABLE "PayrollLineItem"
  ALTER COLUMN "componentNameSnapshot" SET NOT NULL,
  ALTER COLUMN "componentTypeSnapshot" SET NOT NULL;

-- Replace FK for optional component link
ALTER TABLE "PayrollLineItem" DROP CONSTRAINT "PayrollLineItem_componentId_fkey";
ALTER TABLE "PayrollLineItem"
  ADD CONSTRAINT "PayrollLineItem_componentId_fkey"
  FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

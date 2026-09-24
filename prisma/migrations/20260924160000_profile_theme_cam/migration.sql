-- Design direction changed from "Etiket" to "Cam" (DESIGN.md).
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'cam';
UPDATE "profile" SET "theme" = 'cam' WHERE "theme" = 'etiket';

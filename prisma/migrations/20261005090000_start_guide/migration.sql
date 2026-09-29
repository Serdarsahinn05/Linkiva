-- The editor's "Getting started" card (Faz 18) is for newcomers: pages that already exist start with it closed.
ALTER TABLE "profile" ADD COLUMN "guideDismissedAt" TIMESTAMP(3);

UPDATE "profile" SET "guideDismissedAt" = CURRENT_TIMESTAMP;

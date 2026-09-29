-- Faz 19, step 2: visitors report pages or blocks; staff work through the queue in /admin.
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'SCAM', 'ILLEGAL', 'ADULT', 'HATE', 'IMPERSONATION', 'COPYRIGHT', 'OTHER');

CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "blockId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "email" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_status_createdAt_idx" ON "report"("status", "createdAt");

CREATE INDEX "report_profileId_idx" ON "report"("profileId");

ALTER TABLE "report" ADD CONSTRAINT "report_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "report" ADD CONSTRAINT "report_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Broken link check: the daily result per block destination (ROADMAP Faz 13).
CREATE TYPE "LinkStatus" AS ENUM ('OK', 'BROKEN');

CREATE TABLE "link_check" (
    "blockId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "LinkStatus",
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "link_check_pkey" PRIMARY KEY ("blockId")
);

CREATE INDEX "link_check_checkedAt_idx" ON "link_check"("checkedAt");

ALTER TABLE "link_check" ADD CONSTRAINT "link_check_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

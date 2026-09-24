-- Atomic de-duplication of analytics events (concurrent double clicks were both recorded).
ALTER TABLE "event" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "event_dedupeKey_key" ON "event"("dedupeKey");

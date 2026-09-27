-- Weekly summary mail: opt-out flag and the last claimed send (idempotent cron).
ALTER TABLE "profile" ADD COLUMN "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "digestSentAt" TIMESTAMP(3);

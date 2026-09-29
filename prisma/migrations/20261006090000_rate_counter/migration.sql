-- The app's own rate limits move from Upstash (never configured in production) to the database.
CREATE TABLE "rate_counter" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_counter_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_counter_resetAt_idx" ON "rate_counter"("resetAt");

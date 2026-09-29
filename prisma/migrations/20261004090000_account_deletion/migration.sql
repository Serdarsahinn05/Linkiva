-- Account deletion waits 15 days (restorable by signing in) before everything is erased.
CREATE TABLE "account_deletion" (
    "userId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgeAt" TIMESTAMP(3) NOT NULL,
    "wasPublished" BOOLEAN NOT NULL,

    CONSTRAINT "account_deletion_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "account_deletion_purgeAt_idx" ON "account_deletion"("purgeAt");

ALTER TABLE "account_deletion" ADD CONSTRAINT "account_deletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Past usernames now redirect for 30 days instead of 90: shorten the ones already running.
UPDATE "username_history" SET "expiresAt" = LEAST("expiresAt", "createdAt" + INTERVAL '30 days');

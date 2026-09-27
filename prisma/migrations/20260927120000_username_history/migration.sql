-- Past usernames: redirect to the current one for 90 days and stay unclaimable meanwhile.
CREATE TABLE "username_history" (
    "username" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "username_history_pkey" PRIMARY KEY ("username")
);

CREATE INDEX "username_history_profileId_createdAt_idx" ON "username_history"("profileId", "createdAt");

ALTER TABLE "username_history" ADD CONSTRAINT "username_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

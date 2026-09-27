-- Custom domains: one per profile, served once verified.
CREATE TABLE "custom_domain" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_domain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_domain_profileId_key" ON "custom_domain"("profileId");

CREATE UNIQUE INDEX "custom_domain_hostname_key" ON "custom_domain"("hostname");

ALTER TABLE "custom_domain" ADD CONSTRAINT "custom_domain_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

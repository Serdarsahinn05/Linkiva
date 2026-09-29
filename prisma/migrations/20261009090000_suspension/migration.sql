-- Faz 19, step 3a: staff can suspend a page; the owner cannot publish it again until staff lift it.
ALTER TABLE "profile" ADD COLUMN "suspendedAt" TIMESTAMP(3);

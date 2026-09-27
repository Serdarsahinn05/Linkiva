-- Grid layout: a tile size per block. Existing blocks keep the full-row size, so list pages are unchanged.
CREATE TYPE "BlockSize" AS ENUM ('SMALL', 'WIDE', 'LARGE');
ALTER TABLE "block" ADD COLUMN "size" "BlockSize" NOT NULL DEFAULT 'WIDE';

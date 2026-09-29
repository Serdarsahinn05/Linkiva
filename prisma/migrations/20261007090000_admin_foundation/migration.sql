-- Faz 19, step 1: staff roles, the step-up record, and an append-only audit log.
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

ALTER TABLE "user" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

CREATE TABLE "admin_step_up" (
    "sessionId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_step_up_pkey" PRIMARY KEY ("sessionId")
);

ALTER TABLE "admin_step_up" ADD CONSTRAINT "admin_step_up_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "admin_audit" (
    "id" BIGSERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "reason" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_at_idx" ON "admin_audit"("at");
CREATE INDEX "admin_audit_targetType_targetId_idx" ON "admin_audit"("targetType", "targetId");

-- Append-only, enforced by the database itself: not even the application's own connection can rewrite history.
CREATE FUNCTION "admin_audit_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit is append-only';
END;
$$;

CREATE TRIGGER "admin_audit_no_update_delete"
BEFORE UPDATE OR DELETE ON "admin_audit"
FOR EACH ROW EXECUTE FUNCTION "admin_audit_append_only"();

CREATE TRIGGER "admin_audit_no_truncate"
BEFORE TRUNCATE ON "admin_audit"
FOR EACH STATEMENT EXECUTE FUNCTION "admin_audit_append_only"();

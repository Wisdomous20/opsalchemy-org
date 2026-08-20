-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(32),
    "conversation_summary" TEXT NOT NULL,
    "crm_sync_allowed" BOOLEAN NOT NULL,
    "consent_recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_service_interests" (
    "lead_id" UUID NOT NULL,
    "service_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_service_interests_pkey" PRIMARY KEY ("lead_id", "service_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE INDEX "lead_service_interests_service_id_idx" ON "lead_service_interests"("service_id");

-- AddForeignKey
ALTER TABLE "lead_service_interests"
ADD CONSTRAINT "lead_service_interests_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase exposes tables in the public schema through its Data API. Prisma
-- connects as the database owner, while browser-facing Supabase roles receive
-- no access because no RLS policies are defined.
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_service_interests" ENABLE ROW LEVEL SECURITY;

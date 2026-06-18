-- ============================================================
-- Multi-tenant migration: Teams, TeamMembers, plans and
-- teamId scoping across all business models.
-- See /mnt/skills/user/vext-multitenant (multitenant-guide.md)
-- seções 2.3, 2.4 e 3 para o detalhamento das regras.
-- ============================================================

-- ------------------------------------------------------------
-- 1. New enums
-- ------------------------------------------------------------

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('admin', 'moderator', 'seller');

-- CreateEnum
CREATE TYPE "AccountPlan" AS ENUM ('free', 'premium');

-- ------------------------------------------------------------
-- 2. User.plan
-- ------------------------------------------------------------

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan" "AccountPlan" NOT NULL DEFAULT 'free';

-- ------------------------------------------------------------
-- 3. Teams & TeamMembers
-- ------------------------------------------------------------

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "orgCode" VARCHAR(20) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'seller',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "teams_orgCode_key" ON "teams"("orgCode");

-- CreateIndex
CREATE INDEX "teams_slug_idx" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "teams_orgCode_idx" ON "teams"("orgCode");

-- CreateIndex
CREATE INDEX "teams_ownerId_idx" ON "teams"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- 4. Add nullable teamId columns to business tables
--    (nullable for now — backfilled in step 6, then locked
--    to NOT NULL in step 7 where required)
-- ------------------------------------------------------------

-- AlterTable
ALTER TABLE "contacts"     ADD COLUMN "teamId" INTEGER;
ALTER TABLE "tags"         ADD COLUMN "teamId" INTEGER;
ALTER TABLE "products"     ADD COLUMN "teamId" INTEGER;
ALTER TABLE "cards"        ADD COLUMN "teamId" INTEGER;
ALTER TABLE "tasks"        ADD COLUMN "teamId" INTEGER;
ALTER TABLE "landing_pages" ADD COLUMN "teamId" INTEGER;
ALTER TABLE "audit_logs"   ADD COLUMN "teamId" INTEGER;
ALTER TABLE "notifications" ADD COLUMN "teamId" INTEGER;

-- AlterTable: invites — add teamId, convert role from UserRole -> TeamRole
ALTER TABLE "invites" ADD COLUMN "teamId" INTEGER;
ALTER TABLE "invites" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "invites" ALTER COLUMN "role" TYPE "TeamRole" USING ("role"::text::"TeamRole");
ALTER TABLE "invites" ALTER COLUMN "role" SET DEFAULT 'seller';

-- ------------------------------------------------------------
-- 5. Drop old global uniqueness on tags.label
--    (será substituído por @@unique([teamId, label]))
-- ------------------------------------------------------------

ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_label_key";

-- ------------------------------------------------------------
-- 6. Data backfill — equipe legada "Equipe Principal"
--
--    O usuário com role='admin' mais antigo se torna o ADMIN
--    (Team.ownerId) da equipe legada. Qualquer outro usuário que
--    já fosse 'admin' globalmente é rebaixado para 'moderator'
--    dentro da equipe (admin é único por equipe — ver seção 2.3).
-- ------------------------------------------------------------

INSERT INTO "teams" ("name", "slug", "orgCode", "ownerId", "createdAt", "updatedAt")
SELECT 'Equipe Principal', 'equipe-principal', 'LEGADO',
       (SELECT "id" FROM "users" WHERE "role" = 'admin' ORDER BY "id" ASC LIMIT 1),
       NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "users");

-- Backfill de teamId nas tabelas de negócio (equipe legada = id 1,
-- única equipe nesta migração inicial)
UPDATE "contacts"      SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "tags"          SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "products"      SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "cards"         SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "tasks"         SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "landing_pages" SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "audit_logs"    SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "notifications" SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "invites"       SET "teamId" = (SELECT "id" FROM "teams" LIMIT 1) WHERE "teamId" IS NULL;

-- Resolve duplicidade de tags com o mesmo label dentro da mesma equipe
-- (não deveria existir, mas protege a criação do índice único em 5.)
WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "teamId", "label" ORDER BY "id") AS rn
  FROM "tags"
)
UPDATE "tags" t
SET "label" = t."label" || ' (' || ranked.rn || ')'
FROM ranked
WHERE t."id" = ranked."id" AND ranked.rn > 1;

-- Adiciona todos os usuários como membros da equipe legada.
-- Apenas o owner (definido acima) recebe 'admin'; outros admins
-- globais viram 'moderator'; demais (seller) permanecem 'seller'.
INSERT INTO "team_members" ("teamId", "userId", "role", "joinedAt")
SELECT (SELECT "id" FROM "teams" LIMIT 1),
       u."id",
       CASE
         WHEN u."id" = (SELECT "ownerId" FROM "teams" LIMIT 1) THEN 'admin'::"TeamRole"
         WHEN u."role" = 'admin' THEN 'moderator'::"TeamRole"
         ELSE 'seller'::"TeamRole"
       END,
       u."createdAt"
FROM "users" u
ON CONFLICT ("teamId", "userId") DO NOTHING;

-- Convites pendentes legados com role='admin' (UserRole antigo) não fazem
-- mais sentido — admin nunca é atribuível via convite (seção 2.3).
UPDATE "invites" SET "role" = 'moderator' WHERE "role"::text = 'admin';

-- ------------------------------------------------------------
-- 7. Enforce NOT NULL + foreign keys + indexes on teamId
--    (audit_logs e notifications permanecem NULLABLE)
-- ------------------------------------------------------------

ALTER TABLE "contacts"      ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "tags"          ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "products"      ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "cards"         ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "tasks"         ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "landing_pages" ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "invites"       ALTER COLUMN "teamId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "contacts_teamId_idx"      ON "contacts"("teamId");
CREATE INDEX "products_teamId_idx"      ON "products"("teamId");
CREATE INDEX "cards_teamId_idx"         ON "cards"("teamId");
CREATE INDEX "tasks_teamId_idx"         ON "tasks"("teamId");
CREATE INDEX "landing_pages_teamId_idx" ON "landing_pages"("teamId");
CREATE INDEX "audit_logs_teamId_idx"    ON "audit_logs"("teamId");
CREATE INDEX "notifications_teamId_idx" ON "notifications"("teamId");
CREATE INDEX "tags_teamId_idx"          ON "tags"("teamId");
CREATE INDEX "invites_teamId_idx"       ON "invites"("teamId");

-- CreateIndex: nova unicidade de tags por equipe
CREATE UNIQUE INDEX "tags_teamId_label_key" ON "tags"("teamId", "label");

-- AddForeignKey
ALTER TABLE "contacts"      ADD CONSTRAINT "contacts_teamId_fkey"      FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "tags"          ADD CONSTRAINT "tags_teamId_fkey"          FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "products"      ADD CONSTRAINT "products_teamId_fkey"      FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "cards"         ADD CONSTRAINT "cards_teamId_fkey"         FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "tasks"         ADD CONSTRAINT "tasks_teamId_fkey"         FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "audit_logs"    ADD CONSTRAINT "audit_logs_teamId_fkey"    FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL  ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL  ON UPDATE CASCADE;
ALTER TABLE "invites"       ADD CONSTRAINT "invites_teamId_fkey"       FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE  ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- 8. Garantia "um único ADMIN por equipe" — índice único parcial
--    (Prisma não suporta WHERE em índices únicos no schema)
-- ------------------------------------------------------------

CREATE UNIQUE INDEX "team_members_one_admin_per_team"
  ON "team_members" ("teamId")
  WHERE "role" = 'admin';

/*
  Warnings:

  - The values [deal] on the enum `EntityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [deal] on the enum `PredictionEntityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `dealId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `deal_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deals` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CardStage" AS ENUM ('prospecting', 'qualification', 'presentation', 'negotiation', 'won', 'lost');

-- AlterEnum
BEGIN;
CREATE TYPE "EntityType_new" AS ENUM ('card', 'contact', 'product', 'user', 'invite', 'task', 'landing_page');
ALTER TABLE "audit_logs" ALTER COLUMN "entityType" TYPE "EntityType_new" USING ("entityType"::text::"EntityType_new");
ALTER TYPE "EntityType" RENAME TO "EntityType_old";
ALTER TYPE "EntityType_new" RENAME TO "EntityType";
DROP TYPE "public"."EntityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PredictionEntityType_new" AS ENUM ('contact', 'card');
ALTER TABLE "ai_predictions" ALTER COLUMN "entityType" TYPE "PredictionEntityType_new" USING ("entityType"::text::"PredictionEntityType_new");
ALTER TYPE "PredictionEntityType" RENAME TO "PredictionEntityType_old";
ALTER TYPE "PredictionEntityType_new" RENAME TO "PredictionEntityType";
DROP TYPE "public"."PredictionEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "deal_tags" DROP CONSTRAINT "deal_tags_dealId_fkey";

-- DropForeignKey
ALTER TABLE "deal_tags" DROP CONSTRAINT "deal_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_contactId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_dealId_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "dealId",
ADD COLUMN     "cardId" INTEGER;

-- DropTable
DROP TABLE "deal_tags";

-- DropTable
DROP TABLE "deals";

-- DropEnum
DROP TYPE "DealStage";

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "stage" "CardStage" NOT NULL DEFAULT 'prospecting',
    "probability" INTEGER NOT NULL DEFAULT 10,
    "contactId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "productId" INTEGER,
    "budgetConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "decisionMakerIdentified" BOOLEAN NOT NULL DEFAULT false,
    "painPoints" TEXT,
    "competitors" TEXT,
    "timeline" VARCHAR(100),
    "nextFollowUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_tags" (
    "cardId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "card_tags_pkey" PRIMARY KEY ("cardId","tagId")
);

-- CreateIndex
CREATE INDEX "cards_stage_idx" ON "cards"("stage");

-- CreateIndex
CREATE INDEX "cards_contactId_idx" ON "cards"("contactId");

-- CreateIndex
CREATE INDEX "cards_ownerId_idx" ON "cards"("ownerId");

-- CreateIndex
CREATE INDEX "cards_nextFollowUpDate_idx" ON "cards"("nextFollowUpDate");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

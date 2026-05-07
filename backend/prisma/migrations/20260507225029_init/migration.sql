-- CreateEnum
CREATE TYPE "CardEventType" AS ENUM ('created', 'stage_changed', 'value_changed', 'contact_changed', 'tags_changed', 'note_added', 'task_scheduled', 'closed_won', 'closed_lost', 'reopened', 'edited');

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "card_events" (
    "id" SERIAL NOT NULL,
    "cardId" INTEGER NOT NULL,
    "type" "CardEventType" NOT NULL,
    "fromValue" VARCHAR(255),
    "toValue" VARCHAR(255),
    "description" TEXT,
    "metadata" JSONB,
    "userId" INTEGER NOT NULL,
    "userName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_events_cardId_createdAt_idx" ON "card_events"("cardId", "createdAt");

-- CreateIndex
CREATE INDEX "card_events_userId_idx" ON "card_events"("userId");

-- CreateIndex
CREATE INDEX "card_events_type_idx" ON "card_events"("type");

-- CreateIndex
CREATE INDEX "tags_isActive_idx" ON "tags"("isActive");

-- AddForeignKey
ALTER TABLE "card_events" ADD CONSTRAINT "card_events_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

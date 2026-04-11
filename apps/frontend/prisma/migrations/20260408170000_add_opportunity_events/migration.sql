-- CreateEnum
CREATE TYPE "OpportunityEventType" AS ENUM ('stage_changed', 'owner_changed');

-- CreateTable
CREATE TABLE "opportunity_events" (
    "id" SERIAL NOT NULL,
    "opportunity_id" INTEGER NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "event_type" "OpportunityEventType" NOT NULL,
    "from_stage" "OpportunityStage",
    "to_stage" "OpportunityStage",
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_events_opportunity_id_created_at_idx" ON "opportunity_events"("opportunity_id", "created_at");

-- CreateIndex
CREATE INDEX "opportunity_events_actor_user_id_created_at_idx" ON "opportunity_events"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add timeline fields to drops
ALTER TABLE "drops"
  ADD COLUMN IF NOT EXISTS "deposit_opens_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "balance_due_at" TIMESTAMP(3);

-- Backfill balance_due_at from release_at for existing rows
UPDATE "drops"
SET "balance_due_at" = "release_at"
WHERE "balance_due_at" IS NULL;

ALTER TABLE "drops"
  ALTER COLUMN "balance_due_at" SET NOT NULL;

-- Add inventory state for sold pairs
ALTER TABLE "drop_sizes"
  ADD COLUMN IF NOT EXISTS "sold_inventory" INTEGER NOT NULL DEFAULT 0;

-- Add order timestamps/deadline
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "balance_due_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paid_in_full_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3);

-- Backfill order due date from related drop when possible
UPDATE "orders" o
SET "balance_due_at" = d."balance_due_at"
FROM "drops" d
WHERE o."drop_id" = d."id"
  AND o."balance_due_at" IS NULL;

ALTER TABLE "orders"
  ALTER COLUMN "balance_due_at" SET NOT NULL;

-- Replace legacy balance_due with overdue and add refunded
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = 'overdue'
        AND enumtypid = 'OrderStatus'::regtype
    ) THEN
      ALTER TYPE "OrderStatus" ADD VALUE 'overdue';
    END IF;

    UPDATE "orders"
    SET "status" = 'overdue'
    WHERE "status"::text = 'balance_due';

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = 'refunded'
        AND enumtypid = 'OrderStatus'::regtype
    ) THEN
      ALTER TYPE "OrderStatus" ADD VALUE 'refunded';
    END IF;
  END IF;
END $$;

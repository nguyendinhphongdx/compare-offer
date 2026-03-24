-- Step 1: Add columns as nullable first
ALTER TABLE "of_shared_comparisons" ADD COLUMN "offers_hash" TEXT;
ALTER TABLE "of_shared_comparisons" ADD COLUMN "updated_at" TIMESTAMP(3);

-- Step 2: Backfill existing rows with default values
UPDATE "of_shared_comparisons" SET "offers_hash" = id WHERE "offers_hash" IS NULL;
UPDATE "of_shared_comparisons" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;

-- Step 3: Set columns to NOT NULL
ALTER TABLE "of_shared_comparisons" ALTER COLUMN "offers_hash" SET NOT NULL;
ALTER TABLE "of_shared_comparisons" ALTER COLUMN "updated_at" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "of_shared_comparisons_user_id_offers_hash_key" ON "of_shared_comparisons"("user_id", "offers_hash");

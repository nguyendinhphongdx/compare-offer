-- CreateTable
CREATE TABLE "of_shared_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "offers" JSONB NOT NULL,
    "criteria" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "of_shared_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "of_shared_comparisons_user_id_idx" ON "of_shared_comparisons"("user_id");

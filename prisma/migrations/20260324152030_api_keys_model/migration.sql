/*
  Warnings:

  - You are about to drop the column `gemini_api_key` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "gemini_api_key";

-- CreateTable
CREATE TABLE "of_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "api_key" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_valid" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "of_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "of_api_keys_user_id_idx" ON "of_api_keys"("user_id");

-- CreateIndex
CREATE INDEX "of_api_keys_user_id_provider_idx" ON "of_api_keys"("user_id", "provider");

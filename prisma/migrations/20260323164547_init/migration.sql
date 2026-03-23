-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "of_offers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "logo" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "overall_rating" DOUBLE PRECISION,
    "values" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "deadline" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "of_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "of_custom_criteria" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "of_custom_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "of_chat_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "of_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "of_offers_user_id_idx" ON "of_offers"("user_id");

-- CreateIndex
CREATE INDEX "of_custom_criteria_user_id_idx" ON "of_custom_criteria"("user_id");

-- CreateIndex
CREATE INDEX "of_chat_messages_user_id_idx" ON "of_chat_messages"("user_id");

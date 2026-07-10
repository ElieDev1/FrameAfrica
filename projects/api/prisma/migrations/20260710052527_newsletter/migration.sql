-- CreateTable
CREATE TABLE "newsletter_subscriber" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" CITEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "unsubscribe_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_unsubscribe_token_key" ON "newsletter_subscriber"("unsubscribe_token");

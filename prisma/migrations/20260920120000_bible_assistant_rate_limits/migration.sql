CREATE TABLE "bible_assistant_rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bible_assistant_rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "bible_assistant_rate_limits_expires_at_idx" ON "bible_assistant_rate_limits"("expires_at");

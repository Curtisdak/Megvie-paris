CREATE TYPE "expense_status" AS ENUM ('RECORDED', 'CANCELLED');

CREATE TABLE "finance_expenses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL CHECK ("amount_cents" > 0),
    "currency" TEXT NOT NULL DEFAULT 'eur' CHECK ("currency" = 'eur'),
    "occurred_at" DATE NOT NULL,
    "payee" TEXT,
    "reference" TEXT,
    "note" TEXT,
    "status" "expense_status" NOT NULL DEFAULT 'RECORDED',
    "entry_request_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finance_expenses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "finance_expenses_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "finance_expenses_entry_request_id_key" ON "finance_expenses"("entry_request_id");
CREATE INDEX "finance_expenses_status_occurred_at_idx" ON "finance_expenses"("status", "occurred_at");
CREATE INDEX "finance_expenses_category_occurred_at_idx" ON "finance_expenses"("category", "occurred_at");
CREATE INDEX "finance_expenses_created_by_user_id_idx" ON "finance_expenses"("created_by_user_id");

ALTER TABLE "reportMetrics"
  ADD COLUMN IF NOT EXISTS "sitePurchases" integer,
  ADD COLUMN IF NOT EXISTS "whatsappPurchases" integer;

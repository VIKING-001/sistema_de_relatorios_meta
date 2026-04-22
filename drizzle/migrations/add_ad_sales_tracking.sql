-- Migration: Add complete ad sales tracking system
-- Creates tables for campaigns, adsets, ads, metrics, and sales tracking

-- ─── Campanhas do Meta ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "metaCampaigns" (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "metaCampaignId" VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(64),
  objective VARCHAR(64),
  "dailyBudget" INTEGER,
  "lifetimeBudget" INTEGER,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE CASCADE
);

CREATE INDEX idx_metaCampaigns_companyId ON "metaCampaigns"("companyId");
CREATE INDEX idx_metaCampaigns_metaCampaignId ON "metaCampaigns"("metaCampaignId");

-- ─── Adsets (Conjuntos de Anúncios) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "metaAdsets" (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "campaignId" INTEGER NOT NULL,
  "metaAdsetId" VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(64),
  budget INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE CASCADE,
  FOREIGN KEY ("campaignId") REFERENCES "metaCampaigns"(id) ON DELETE CASCADE
);

CREATE INDEX idx_metaAdsets_companyId ON "metaAdsets"("companyId");
CREATE INDEX idx_metaAdsets_campaignId ON "metaAdsets"("campaignId");
CREATE INDEX idx_metaAdsets_metaAdsetId ON "metaAdsets"("metaAdsetId");

-- ─── Anúncios ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "metaAds" (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "adsetId" INTEGER NOT NULL,
  "campaignId" INTEGER NOT NULL,
  "metaAdId" VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(64),
  "creativeName" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE CASCADE,
  FOREIGN KEY ("adsetId") REFERENCES "metaAdsets"(id) ON DELETE CASCADE,
  FOREIGN KEY ("campaignId") REFERENCES "metaCampaigns"(id) ON DELETE CASCADE
);

CREATE INDEX idx_metaAds_companyId ON "metaAds"("companyId");
CREATE INDEX idx_metaAds_adsetId ON "metaAds"("adsetId");
CREATE INDEX idx_metaAds_campaignId ON "metaAds"("campaignId");
CREATE INDEX idx_metaAds_metaAdId ON "metaAds"("metaAdId");

-- ─── Métricas de Anúncio ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "adMetrics" (
  id SERIAL PRIMARY KEY,
  "adId" INTEGER NOT NULL,
  "adsetId" INTEGER NOT NULL,
  "campaignId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  date DATE NOT NULL,
  spend INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  "conversionValue" DECIMAL(12, 2) DEFAULT 0.00,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("adId") REFERENCES "metaAds"(id) ON DELETE CASCADE,
  FOREIGN KEY ("adsetId") REFERENCES "metaAdsets"(id) ON DELETE CASCADE,
  FOREIGN KEY ("campaignId") REFERENCES "metaCampaigns"(id) ON DELETE CASCADE,
  FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE,
  UNIQUE("adId", date)
);

CREATE INDEX idx_adMetrics_adId ON "adMetrics"("adId");
CREATE INDEX idx_adMetrics_adsetId ON "adMetrics"("adsetId");
CREATE INDEX idx_adMetrics_campaignId ON "adMetrics"("campaignId");
CREATE INDEX idx_adMetrics_date ON "adMetrics"(date);

-- ─── Rastreamento de Vendas por Anúncio ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "adSales" (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "adId" INTEGER NOT NULL,
  "adsetId" INTEGER NOT NULL,
  "campaignId" INTEGER NOT NULL,
  "saleId" INTEGER,
  "utmTrackingId" INTEGER,
  "saleValue" DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  source VARCHAR(64) NOT NULL,
  "saleDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE CASCADE,
  FOREIGN KEY ("adId") REFERENCES "metaAds"(id) ON DELETE CASCADE,
  FOREIGN KEY ("adsetId") REFERENCES "metaAdsets"(id) ON DELETE CASCADE,
  FOREIGN KEY ("campaignId") REFERENCES "metaCampaigns"(id) ON DELETE CASCADE
);

CREATE INDEX idx_adSales_campaignId ON "adSales"("campaignId");
CREATE INDEX idx_adSales_adsetId ON "adSales"("adsetId");
CREATE INDEX idx_adSales_adId ON "adSales"("adId");
CREATE INDEX idx_adSales_saleDate ON "adSales"("saleDate");
CREATE INDEX idx_adSales_source ON "adSales"(source);
CREATE INDEX idx_adSales_companyId ON "adSales"("companyId");

-- Rastreamento de links UTM
CREATE TABLE IF NOT EXISTS "utmTracking" (
  "id" serial PRIMARY KEY,
  "companyId" integer NOT NULL,
  "userId" integer NOT NULL,
  "baseUrl" text NOT NULL,
  "utmSource" varchar(255),
  "utmMedium" varchar(255),
  "utmCampaign" varchar(255) NOT NULL,
  "utmContent" varchar(255),
  "utmTerm" varchar(255),
  "trackingUrl" text NOT NULL,
  "shortCode" varchar(20) UNIQUE,
  "clickCount" integer NOT NULL DEFAULT 0,
  "conversionCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sessões de usuários rastreadas
CREATE TABLE IF NOT EXISTS "utmSessions" (
  "id" serial PRIMARY KEY,
  "trackingId" integer NOT NULL REFERENCES "utmTracking"("id"),
  "sessionId" varchar(255) NOT NULL,
  "ipAddress" varchar(45),
  "userAgent" text,
  "referrer" text,
  "clickedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "convertedAt" timestamp,
  "conversionValue" decimal(12, 2),
  "conversionType" varchar(64),
  "externalConversionId" varchar(255)
);

-- Vendas rastreadas por UTM
CREATE TABLE IF NOT EXISTS "trackedSales" (
  "id" serial PRIMARY KEY,
  "companyId" integer NOT NULL,
  "userId" integer NOT NULL,
  "sessionId" integer REFERENCES "utmSessions"("id"),
  "trackingId" integer REFERENCES "utmTracking"("id"),
  "utmSource" varchar(255),
  "utmMedium" varchar(255),
  "utmCampaign" varchar(255),
  "utmContent" varchar(255),
  "utmTerm" varchar(255),
  "orderId" varchar(255) NOT NULL,
  "orderValue" decimal(12, 2) NOT NULL,
  "currency" varchar(3) DEFAULT 'BRL',
  "saleDate" timestamp NOT NULL,
  "customerEmail" varchar(320),
  "customerPhone" varchar(20),
  "source" varchar(64) NOT NULL,
  "externalId" varchar(255),
  "status" varchar(64) DEFAULT 'confirmed',
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Webhooks de integração
CREATE TABLE IF NOT EXISTS "webhookConfigs" (
  "id" serial PRIMARY KEY,
  "companyId" integer NOT NULL,
  "userId" integer NOT NULL,
  "platform" varchar(64) NOT NULL,
  "webhookUrl" text NOT NULL,
  "webhookSecret" varchar(255) NOT NULL,
  "config" text,
  "status" varchar(64) DEFAULT 'active',
  "lastHealthCheck" timestamp,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_utmTracking_companyId" ON "utmTracking"("companyId");
CREATE INDEX IF NOT EXISTS "idx_utmSessions_trackingId" ON "utmSessions"("trackingId");
CREATE INDEX IF NOT EXISTS "idx_utmSessions_sessionId" ON "utmSessions"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_trackedSales_companyId" ON "trackedSales"("companyId");
CREATE INDEX IF NOT EXISTS "idx_trackedSales_trackingId" ON "trackedSales"("trackingId");
CREATE INDEX IF NOT EXISTS "idx_trackedSales_saleDate" ON "trackedSales"("saleDate");
CREATE INDEX IF NOT EXISTS "idx_webhookConfigs_companyId" ON "webhookConfigs"("companyId");

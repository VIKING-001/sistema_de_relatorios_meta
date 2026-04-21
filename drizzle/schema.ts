import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, date, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** Internal unique identifier (UUID-based). */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** Bcrypt hash of the user's password. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").default("user").notNull(), // PG handles enums differently, text is safer for migration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Empresas/Clientes
 */
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  /** Meta Ads: ID da conta de anúncios (ex: act_1234567890) */
  metaAdAccountId: varchar("metaAdAccountId", { length: 64 }),
  /** Meta Ads: Access Token (long-lived, 60 dias) */
  metaAccessToken: text("metaAccessToken"),
  /** Meta Ads: Data de expiração do token */
  metaTokenExpiresAt: timestamp("metaTokenExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Relatórios de campanhas Meta
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  isPublished: text("isPublished").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Métricas de campanhas Meta
 */
export const reportMetrics = pgTable("reportMetrics", {
  id: serial("id").primaryKey(),
  reportId: integer("reportId").notNull(),
  instagramReach: integer("instagramReach").notNull().default(0),
  totalReach: integer("totalReach").notNull().default(0),
  totalImpressions: integer("totalImpressions").notNull().default(0),
  instagramProfileVisits: integer("instagramProfileVisits").notNull().default(0),
  newInstagramFollowers: integer("newInstagramFollowers").notNull().default(0),
  messagesInitiated: integer("messagesInitiated").notNull().default(0),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalClicks: integer("totalClicks").notNull().default(0),
  costPerClick: decimal("costPerClick", { precision: 10, scale: 2 }).notNull().default("0.00"),
  videoRetentionRate: decimal("videoRetentionRate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  profileVisitsThroughCampaigns: integer("profileVisitsThroughCampaigns").notNull().default(0),
  costPerProfileVisit: decimal("costPerProfileVisit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  cpm: decimal("cpm", { precision: 10, scale: 2 }).notNull().default("0.00"),
  ctr: decimal("ctr", { precision: 5, scale: 2 }).notNull().default("0.00"),
  /** Conversões / Compras */
  purchases: integer("purchases").notNull().default(0),
  purchaseValue: decimal("purchaseValue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  costPerPurchase: decimal("costPerPurchase", { precision: 10, scale: 2 }).notNull().default("0.00"),
  /** Custo por mensagem iniciada */
  costPerMessage: decimal("costPerMessage", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReportMetrics = typeof reportMetrics.$inferSelect;
export type InsertReportMetrics = typeof reportMetrics.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  reports: many(reports),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  company: one(companies, {
    fields: [reports.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  metrics: many(reportMetrics),
}));

export const reportMetricsRelations = relations(reportMetrics, ({ one }) => ({
  report: one(reports, {
    fields: [reportMetrics.reportId],
    references: [reports.id],
  }),
}));

/**
 * Rastreamento de links UTM — cada link gerado fica registrado
 */
export const utmTracking = pgTable("utmTracking", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  /** URL original (sem UTMs) */
  baseUrl: text("baseUrl").notNull(),
  /** Parâmetros UTM completos */
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }).notNull(),
  utmContent: varchar("utmContent", { length: 255 }),
  utmTerm: varchar("utmTerm", { length: 255 }),
  /** URL completa com UTMs para usar em campanhas */
  trackingUrl: text("trackingUrl").notNull(),
  /** Hash curto para encurtador de URL (opcional) */
  shortCode: varchar("shortCode", { length: 20 }).unique(),
  /** Quantas vezes o link foi clicado (rastreado via redirect) */
  clickCount: integer("clickCount").notNull().default(0),
  /** Quantas conversões vieram deste link */
  conversionCount: integer("conversionCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UtmTracking = typeof utmTracking.$inferSelect;
export type InsertUtmTracking = typeof utmTracking.$inferInsert;

/**
 * Sessões rastreadas — quando alguém clica num link UTM, registramos a sessão
 */
export const utmSessions = pgTable("utmSessions", {
  id: serial("id").primaryKey(),
  trackingId: integer("trackingId").notNull(),
  /** ID único da sessão (pode ser cookie/browser fingerprint) */
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  /** IP do usuário */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** User agent do navegador */
  userAgent: text("userAgent"),
  /** Referrer */
  referrer: text("referrer"),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
  convertedAt: timestamp("convertedAt"),
  conversionValue: decimal("conversionValue", { precision: 12, scale: 2 }),
  /** Ex: "purchase", "signup", "email_lead" */
  conversionType: varchar("conversionType", { length: 64 }),
  /** ID externo da conversão (ex: order ID, customer ID) */
  externalConversionId: varchar("externalConversionId", { length: 255 }),
});

export type UtmSession = typeof utmSessions.$inferSelect;
export type InsertUtmSession = typeof utmSessions.$inferInsert;

/**
 * Vendas rastreadas — registro de cada conversão/venda
 * Conecta compra real com a UTM que originou
 */
export const trackedSales = pgTable("trackedSales", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  /** Sessão que originou a compra */
  sessionId: integer("sessionId"),
  /** UTM que originou */
  trackingId: integer("trackingId"),
  /** Parâmetros UTM no momento da venda (snapshot) */
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  utmContent: varchar("utmContent", { length: 255 }),
  utmTerm: varchar("utmTerm", { length: 255 }),
  /** Dados da venda */
  orderId: varchar("orderId", { length: 255 }).notNull(),
  orderValue: decimal("orderValue", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  /** Marca de tempo da venda */
  saleDate: timestamp("saleDate").notNull(),
  /** Dados do cliente (anonimizados) */
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  /** Qual plataforma capturou (webhook Shopify, webhook custom, Meta API, etc) */
  source: varchar("source", { length: 64 }).notNull(),
  /** Identificador da plataforma (ex: Shopify order ID, WooCommerce order ID) */
  externalId: varchar("externalId", { length: 255 }),
  /** Status da venda (pending, confirmed, refunded) */
  status: varchar("status", { length: 64 }).default("confirmed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TrackedSale = typeof trackedSales.$inferSelect;
export type InsertTrackedSale = typeof trackedSales.$inferInsert;

/**
 * Webhooks configurados — credenciais para integrar com plataformas de vendas
 */
export const webhookConfigs = pgTable("webhookConfigs", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  /** Tipo de plataforma: shopify, woocommerce, custom, zapier */
  platform: varchar("platform", { length: 64 }).notNull(),
  /** URL do webhook (gerado pelo sistema) que a plataforma vai chamar */
  webhookUrl: text("webhookUrl").notNull(),
  /** Secret para validar webhook (HMAC) */
  webhookSecret: varchar("webhookSecret", { length: 255 }).notNull(),
  /** Dados de configuração específicos da plataforma (JSON) */
  config: text("config"),
  /** Status da integração */
  status: varchar("status", { length: 64 }).default("active"),
  /** Último ping/teste bem-sucedido */
  lastHealthCheck: timestamp("lastHealthCheck"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

// ─── Relations para rastreamento ───────────────────────────────────────────
export const utmTrackingRelations = relations(utmTracking, ({ one, many }) => ({
  company: one(companies, {
    fields: [utmTracking.companyId],
    references: [companies.id],
  }),
  sessions: many(utmSessions),
}));

export const utmSessionsRelations = relations(utmSessions, ({ one }) => ({
  tracking: one(utmTracking, {
    fields: [utmSessions.trackingId],
    references: [utmTracking.id],
  }),
}));

export const trackedSalesRelations = relations(trackedSales, ({ one }) => ({
  company: one(companies, {
    fields: [trackedSales.companyId],
    references: [companies.id],
  }),
  tracking: one(utmTracking, {
    fields: [trackedSales.trackingId],
    references: [utmTracking.id],
  }),
}));

export const webhookConfigsRelations = relations(webhookConfigs, ({ one }) => ({
  company: one(companies, {
    fields: [webhookConfigs.companyId],
    references: [companies.id],
  }),
}));

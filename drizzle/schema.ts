import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Empresas/Clientes para os quais os relatórios são criados
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Relatórios de campanhas Meta com versionamento
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  isPublished: mysqlEnum("isPublished", ["draft", "published"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Métricas de campanhas Meta - dados específicos de cada relatório
 */
export const reportMetrics = mysqlTable("reportMetrics", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  // Métricas de alcance e impressões
  instagramReach: int("instagramReach").notNull().default(0),
  totalReach: int("totalReach").notNull().default(0),
  totalImpressions: int("totalImpressions").notNull().default(0),
  instagramProfileVisits: int("instagramProfileVisits").notNull().default(0),
  newInstagramFollowers: int("newInstagramFollowers").notNull().default(0),
  messagesInitiated: int("messagesInitiated").notNull().default(0),
  // Métricas de custo e cliques
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalClicks: int("totalClicks").notNull().default(0),
  costPerClick: decimal("costPerClick", { precision: 10, scale: 2 }).notNull().default("0.00"),
  // Métricas de vídeo e engajamento
  videoRetentionRate: decimal("videoRetentionRate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  profileVisitsThroughCampaigns: int("profileVisitsThroughCampaigns").notNull().default(0),
  costPerProfileVisit: decimal("costPerProfileVisit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  // Métricas calculadas
  cpm: decimal("cpm", { precision: 10, scale: 2 }).notNull().default("0.00"),
  ctr: decimal("ctr", { precision: 5, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

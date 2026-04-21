import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import crypto from "crypto";

// ─── Validações ────────────────────────────────────────────────────────────

const createUtmTrackingSchema = z.object({
  companyId: z.number().int().positive(),
  baseUrl: z.string().url(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().min(1),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
});

const trackConversionSchema = z.object({
  sessionId: z.string(),
  trackingId: z.number().int().positive(),
  conversionType: z.string(),
  conversionValue: z.number().positive().optional(),
});

const recordSaleSchema = z.object({
  companyId: z.number().int().positive(),
  orderId: z.string().min(1),
  orderValue: z.number().positive(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  source: z.enum(["shopify", "woocommerce", "custom", "zapier"]),
  externalId: z.string().optional(),
});

// ─── Router ────────────────────────────────────────────────────────────────

export const utmRouter = router({
  /**
   * Criar um link de rastreamento UTM
   * POST /api/trpc/utm.create
   */
  create: protectedProcedure
    .input(createUtmTrackingSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Validar permissão à empresa
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa" });
      }

      // Construir URL de rastreamento
      const urlObj = new URL(input.baseUrl);
      if (input.utmSource) urlObj.searchParams.set("utm_source", input.utmSource);
      if (input.utmMedium) urlObj.searchParams.set("utm_medium", input.utmMedium);
      urlObj.searchParams.set("utm_campaign", input.utmCampaign);
      if (input.utmContent) urlObj.searchParams.set("utm_content", input.utmContent);
      if (input.utmTerm) urlObj.searchParams.set("utm_term", input.utmTerm);
      // ID único do rastreamento
      const trackingId = nanoid(12);
      urlObj.searchParams.set("utm_id", trackingId);

      const trackingUrl = urlObj.toString();

      // Gerar short code (opcional, para encurtador)
      const shortCode = nanoid(8);

      // Inserir no banco
      const result = await db.db.query(
        `INSERT INTO "utmTracking" (
          "companyId", "userId", "baseUrl", "utmSource", "utmMedium",
          "utmCampaign", "utmContent", "utmTerm", "trackingUrl", "shortCode"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          input.companyId,
          userId,
          input.baseUrl,
          input.utmSource || null,
          input.utmMedium || null,
          input.utmCampaign,
          input.utmContent || null,
          input.utmTerm || null,
          trackingUrl,
          shortCode,
        ]
      );

      return result.rows[0];
    }),

  /**
   * Listar todos os links de rastreamento da empresa
   */
  list: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await db.db.query(
        `SELECT * FROM "utmTracking" WHERE "companyId" = $1 ORDER BY "createdAt" DESC`,
        [input.companyId]
      );

      return result.rows;
    }),

  /**
   * Webhook público para rastrear cliques (redirect)
   * GET /api/utm/redirect?utm_id=...
   */
  clickRedirect: publicProcedure
    .input(
      z.object({
        utm_id: z.string(),
        sessionId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Encontrar o link de rastreamento
      const trackResult = await db.db.query(
        `SELECT * FROM "utmTracking" WHERE "shortCode" = $1 OR id::text = $1 LIMIT 1`,
        [input.utm_id]
      );

      if (trackResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link não encontrado" });
      }

      const tracking = trackResult.rows[0];
      const sessionId = input.sessionId || nanoid();

      // Registrar clique/sessão
      await db.db.query(
        `INSERT INTO "utmSessions" ("trackingId", "sessionId") VALUES ($1, $2)`,
        [tracking.id, sessionId]
      );

      // Incrementar contador de cliques
      await db.db.query(
        `UPDATE "utmTracking" SET "clickCount" = "clickCount" + 1 WHERE "id" = $1`,
        [tracking.id]
      );

      // Retornar URL de redirecionamento
      return {
        redirectUrl: tracking.baseUrl,
        sessionId,
        trackingId: tracking.id,
      };
    }),

  /**
   * Webhook para registrar conversão/venda
   * POST /api/trpc/utm.recordSale
   */
  recordSale: publicProcedure
    .input(recordSaleSchema)
    .mutation(async ({ input }) => {
      // Validar que a empresa existe
      const companyResult = await db.db.query(
        `SELECT id FROM "companies" WHERE "id" = $1`,
        [input.companyId]
      );

      if (companyResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
      }

      // Procurar tracking ID baseado nos parâmetros UTM
      let trackingId = null;
      if (input.utmCampaign) {
        const trackResult = await db.db.query(
          `SELECT id FROM "utmTracking"
           WHERE "companyId" = $1
             AND "utmCampaign" = $2
             AND "utmSource" IS NOT DISTINCT FROM $3
             AND "utmMedium" IS NOT DISTINCT FROM $4
           ORDER BY "createdAt" DESC LIMIT 1`,
          [input.companyId, input.utmCampaign, input.utmSource || null, input.utmMedium || null]
        );

        if (trackResult.rows.length > 0) {
          trackingId = trackResult.rows[0].id;

          // Incrementar contador de conversões
          await db.db.query(
            `UPDATE "utmTracking" SET "conversionCount" = "conversionCount" + 1 WHERE "id" = $1`,
            [trackingId]
          );
        }
      }

      // Registrar a venda
      const saleResult = await db.db.query(
        `INSERT INTO "trackedSales" (
          "companyId", "userId", "trackingId", "orderId", "orderValue",
          "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm",
          "customerEmail", "customerPhone", "source", "externalId", "saleDate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          input.companyId,
          null, // userId será preenchido pelo webhook
          trackingId,
          input.orderId,
          input.orderValue,
          input.utmSource || null,
          input.utmMedium || null,
          input.utmCampaign || null,
          input.utmContent || null,
          input.utmTerm || null,
          input.customerEmail || null,
          input.customerPhone || null,
          input.source,
          input.externalId || null,
        ]
      );

      return {
        success: true,
        sale: saleResult.rows[0],
        trackingFound: !!trackingId,
      };
    }),

  /**
   * Obter estatísticas de rastreamento (ROAS, conversões, etc)
   */
  getStats: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const startDate = input.startDate ? input.startDate.toISOString().split("T")[0] : null;
      const endDate = input.endDate ? input.endDate.toISOString().split("T")[0] : null;

      let dateFilter = "";
      const params: any[] = [input.companyId];

      if (startDate && endDate) {
        dateFilter = `AND "saleDate"::date BETWEEN $2 AND $3`;
        params.push(startDate, endDate);
      }

      // Agregação total
      const statsResult = await db.db.query(
        `SELECT
          COUNT(DISTINCT "id") as total_sales,
          SUM("orderValue") as total_revenue,
          COUNT(DISTINCT "trackingId") as tracked_campaigns,
          AVG("orderValue") as avg_order_value
        FROM "trackedSales"
        WHERE "companyId" = $1 ${dateFilter}`,
        params
      );

      // Por campanha
      const byUTMResult = await db.db.query(
        `SELECT
          "utmCampaign",
          "utmSource",
          "utmMedium",
          COUNT(*) as sales_count,
          SUM("orderValue") as revenue,
          AVG("orderValue") as avg_value,
          MIN("saleDate") as first_sale,
          MAX("saleDate") as last_sale
        FROM "trackedSales"
        WHERE "companyId" = $1 ${dateFilter}
        GROUP BY "utmCampaign", "utmSource", "utmMedium"
        ORDER BY revenue DESC`,
        params
      );

      return {
        summary: statsResult.rows[0] || {},
        byUTM: byUTMResult.rows,
      };
    }),

  /**
   * Comparar ROAS: gasto em Meta Ads vs Faturamento via UTM
   */
  getRoasComparison: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const startDate = input.startDate?.toISOString().split("T")[0];
      const endDate = input.endDate?.toISOString().split("T")[0];

      // Total gasto em Meta Ads
      let metaSpentResult;
      if (startDate && endDate) {
        metaSpentResult = await db.db.query(
          `SELECT SUM(CAST("totalSpent" AS DECIMAL)) as total_spent
           FROM "reportMetrics"
           WHERE "reportId" IN (
             SELECT id FROM "reports" WHERE "companyId" = $1
             AND "startDate"::text >= $2 AND "endDate"::text <= $3
           )`,
          [input.companyId, startDate, endDate]
        );
      } else {
        metaSpentResult = await db.db.query(
          `SELECT SUM(CAST("totalSpent" AS DECIMAL)) as total_spent
           FROM "reportMetrics"
           WHERE "reportId" IN (SELECT id FROM "reports" WHERE "companyId" = $1)`,
          [input.companyId]
        );
      }

      // Total faturado via UTM
      let utmRevenueResult;
      if (startDate && endDate) {
        utmRevenueResult = await db.db.query(
          `SELECT SUM("orderValue") as total_revenue
           FROM "trackedSales"
           WHERE "companyId" = $1 AND "saleDate"::date BETWEEN $2 AND $3`,
          [input.companyId, startDate, endDate]
        );
      } else {
        utmRevenueResult = await db.db.query(
          `SELECT SUM("orderValue") as total_revenue FROM "trackedSales" WHERE "companyId" = $1`,
          [input.companyId]
        );
      }

      const metaSpent = parseFloat(metaSpentResult.rows[0]?.total_spent || "0");
      const utmRevenue = parseFloat(utmRevenueResult.rows[0]?.total_revenue || "0");
      const roasFromUTM = metaSpent > 0 ? (utmRevenue / metaSpent).toFixed(2) : "0";

      return {
        metaSpent,
        utmRevenue,
        roasFromUTM: parseFloat(roasFromUTM),
        difference: (utmRevenue - metaSpent).toFixed(2),
      };
    }),
});

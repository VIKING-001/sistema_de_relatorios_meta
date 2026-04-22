import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getRawPool } from "./db";
import { TRPCError } from "@trpc/server";

// ─── Database query helper ──────────────────────────────────────────────────
async function executeQuery(sql: string, params: any[] = []) {
  const pool = await getRawPool();
  if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha na conexão com banco" });
  return pool.query(sql, params);
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const getCampaignsSchema = z.object({
  companyId: z.number().int().positive(),
  status: z.enum(["active", "paused", "archived"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const getCampaignDetailSchema = z.object({
  campaignId: z.number().int().positive(),
});

const getAdsetDetailSchema = z.object({
  adsetId: z.number().int().positive(),
});

// ─── Router ────────────────────────────────────────────────────────────────

export const campaignsRouter = router({
  /**
   * Listar campanhas com métricas agregadas
   * Mostra: Campanha | Gastos | Vendas | ROI | CPV
   */
  list: protectedProcedure
    .input(getCampaignsSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão à empresa
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Query: campanhas com gastos e vendas agregadas
      const result = await executeQuery(
        `
        SELECT
          c.id,
          c."metaCampaignId",
          c.name,
          c.status,
          c.objective,
          c."dailyBudget",
          c."lifetimeBudget",
          c."startDate",
          c."endDate",

          -- Gastos (soma de metrics por campanha)
          COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) as "totalSpend",
          COALESCE(SUM(am.impressions), 0) as "totalImpressions",
          COALESCE(SUM(am.clicks), 0) as "totalClicks",

          -- Vendas (soma de sales por campanha)
          COALESCE(SUM(CAST(ads."saleValue" AS NUMERIC(12,2))), 0) as "totalSales",
          COALESCE(COUNT(DISTINCT ads.id), 0) as "totalSalesCount",

          -- Cálculos
          COALESCE(SUM(am.impressions), 0) as impressions,
          CASE
            WHEN COALESCE(SUM(am.impressions), 0) > 0
            THEN ROUND(CAST(COALESCE(SUM(am.clicks), 0) AS NUMERIC) / COALESCE(SUM(am.impressions), 0) * 100, 2)
            ELSE 0
          END as "ctr",
          CASE
            WHEN COALESCE(SUM(am.impressions), 0) > 0
            THEN ROUND(CAST(COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) AS NUMERIC(12,2)) / COALESCE(SUM(am.impressions), 0) * 1000, 2)
            ELSE 0
          END as "cpm"

        FROM "metaCampaigns" c
        LEFT JOIN "metaAds" a ON a."campaignId" = c.id
        LEFT JOIN "adMetrics" am ON am.id = a.id
        LEFT JOIN "adSales" ads ON ads."campaignId" = c.id

        WHERE c."companyId" = $1
        ${input.status ? 'AND c.status = $2' : ''}

        GROUP BY c.id, c."metaCampaignId", c.name, c.status, c.objective, c."dailyBudget", c."lifetimeBudget", c."startDate", c."endDate"
        ORDER BY c."startDate" DESC
        `,
        input.status ? [input.companyId, input.status] : [input.companyId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        metaCampaignId: row.metaCampaignId,
        name: row.name,
        status: row.status,
        objective: row.objective,

        // Métricas
        totalSpend: parseFloat(row.totalSpend || "0"),
        totalImpressions: parseInt(row.totalImpressions || "0"),
        totalClicks: parseInt(row.totalClicks || "0"),
        totalSales: parseFloat(row.totalSales || "0"),
        totalSalesCount: parseInt(row.totalSalesCount || "0"),

        // Calculados
        roi: row.totalSpend > 0 ? ((row.totalSales - row.totalSpend) / row.totalSpend * 100) : 0,
        cpa: row.totalSalesCount > 0 ? row.totalSpend / row.totalSalesCount : 0,
        ctr: parseFloat(row.ctr || "0"),
        cpm: parseFloat(row.cpm || "0"),
      }));
    }),

  /**
   * Detalhes de uma campanha com seus adsets e anúncios
   */
  getDetail: protectedProcedure
    .input(getCampaignDetailSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Buscar campanha e verificar permissão
      const campaignResult = await executeQuery(
        `SELECT * FROM "metaCampaigns" WHERE id = $1`,
        [input.campaignId]
      );

      if (campaignResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });
      }

      const campaign = campaignResult.rows[0];
      const company = await db.getCompanyById(campaign.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Buscar adsets com detalhes
      const adsetsResult = await executeQuery(
        `
        SELECT
          ads.id,
          ads."metaAdsetId",
          ads.name,
          ads.status,
          ads.budget,

          -- Gastos e métricas
          COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) as "totalSpend",
          COALESCE(SUM(am.impressions), 0) as "totalImpressions",
          COALESCE(SUM(am.clicks), 0) as "totalClicks",

          -- Vendas
          COALESCE(SUM(CAST(adsales."saleValue" AS NUMERIC(12,2))), 0) as "totalSales",
          COALESCE(COUNT(DISTINCT adsales.id), 0) as "totalSalesCount"

        FROM "metaAdsets" ads
        LEFT JOIN "metaAds" a ON a."adsetId" = ads.id
        LEFT JOIN "adMetrics" am ON am."adsetId" = ads.id
        LEFT JOIN "adSales" adsales ON adsales."adsetId" = ads.id

        WHERE ads."campaignId" = $1

        GROUP BY ads.id, ads."metaAdsetId", ads.name, ads.status, ads.budget
        ORDER BY ads."createdAt" DESC
        `,
        [input.campaignId]
      );

      // Para cada adset, buscar seus anúncios
      const adsets = await Promise.all(
        adsetsResult.rows.map(async (adset: any) => {
          const adsResult = await executeQuery(
            `
            SELECT
              a.id,
              a."metaAdId",
              a.name,
              a.status,
              a."creativeName",

              -- Gastos e métricas
              COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) as "totalSpend",
              COALESCE(SUM(am.impressions), 0) as "totalImpressions",
              COALESCE(SUM(am.clicks), 0) as "totalClicks",

              -- Vendas
              COALESCE(SUM(CAST(adsales."saleValue" AS NUMERIC(12,2))), 0) as "totalSales",
              COALESCE(COUNT(DISTINCT adsales.id), 0) as "totalSalesCount"

            FROM "metaAds" a
            LEFT JOIN "adMetrics" am ON am."adId" = a.id
            LEFT JOIN "adSales" adsales ON adsales."adId" = a.id

            WHERE a."adsetId" = $1

            GROUP BY a.id, a."metaAdId", a.name, a.status, a."creativeName"
            ORDER BY a."createdAt" DESC
            `,
            [adset.id]
          );

          return {
            id: adset.id,
            metaAdsetId: adset.metaAdsetId,
            name: adset.name,
            status: adset.status,
            budget: adset.budget,

            totalSpend: parseFloat(adset.totalSpend || "0"),
            totalImpressions: parseInt(adset.totalImpressions || "0"),
            totalClicks: parseInt(adset.totalClicks || "0"),
            totalSales: parseFloat(adset.totalSales || "0"),
            totalSalesCount: parseInt(adset.totalSalesCount || "0"),

            roi: adset.totalSpend > 0 ? ((adset.totalSales - adset.totalSpend) / adset.totalSpend * 100) : 0,
            cpa: adset.totalSalesCount > 0 ? adset.totalSpend / adset.totalSalesCount : 0,

            ads: adsResult.rows.map((ad: any) => ({
              id: ad.id,
              metaAdId: ad.metaAdId,
              name: ad.name,
              status: ad.status,
              creativeName: ad.creativeName,

              totalSpend: parseFloat(ad.totalSpend || "0"),
              totalImpressions: parseInt(ad.totalImpressions || "0"),
              totalClicks: parseInt(ad.totalClicks || "0"),
              totalSales: parseFloat(ad.totalSales || "0"),
              totalSalesCount: parseInt(ad.totalSalesCount || "0"),

              roi: ad.totalSpend > 0 ? ((ad.totalSales - ad.totalSpend) / ad.totalSpend * 100) : 0,
              cpa: ad.totalSalesCount > 0 ? ad.totalSpend / ad.totalSalesCount : 0,
            })),
          };
        })
      );

      return {
        campaign,
        adsets,
      };
    }),

  /**
   * Registrar uma venda para um anúncio
   * Chamado pelo webhook quando uma venda é rastreada
   */
  recordSale: protectedProcedure
    .input(
      z.object({
        adId: z.number().int().positive(),
        adsetId: z.number().int().positive(),
        campaignId: z.number().int().positive(),
        saleValue: z.number().positive(),
        source: z.enum(["webhook", "pixel", "utm", "manual"]),
        utmTrackingId: z.number().optional(),
        saleDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar que o ad pertence ao usuário
      const adResult = await executeQuery(
        `SELECT * FROM "metaAds" WHERE id = $1`,
        [input.adId]
      );

      if (adResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anúncio não encontrado" });
      }

      const ad = adResult.rows[0];
      if (ad.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Inserir venda
      const result = await executeQuery(
        `
        INSERT INTO "adSales" (
          "companyId", "userId", "adId", "adsetId", "campaignId",
          "saleValue", "source", "utmTrackingId", "saleDate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          ad.companyId,
          userId,
          input.adId,
          input.adsetId,
          input.campaignId,
          input.saleValue,
          input.source,
          input.utmTrackingId || null,
          input.saleDate,
        ]
      );

      return result.rows[0];
    }),

  /**
   * Buscar vendas de uma campanha com filtros
   */
  getSales: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        adsetId: z.number().int().optional(),
        adId: z.number().int().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão
      const campaignResult = await executeQuery(
        `SELECT * FROM "metaCampaigns" WHERE id = $1`,
        [input.campaignId]
      );

      if (campaignResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const campaign = campaignResult.rows[0];
      const company = await db.getCompanyById(campaign.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      let sql = `
        SELECT
          adsales.*,
          a.name as "adName",
          ads.name as "adsetName"
        FROM "adSales" adsales
        LEFT JOIN "metaAds" a ON a.id = adsales."adId"
        LEFT JOIN "metaAdsets" ads ON ads.id = adsales."adsetId"
        WHERE adsales."campaignId" = $1
      `;

      const params: any[] = [input.campaignId];

      if (input.adsetId) {
        sql += ` AND adsales."adsetId" = $${params.length + 1}`;
        params.push(input.adsetId);
      }

      if (input.adId) {
        sql += ` AND adsales."adId" = $${params.length + 1}`;
        params.push(input.adId);
      }

      sql += ` ORDER BY adsales."saleDate" DESC`;

      const result = await executeQuery(sql, params);
      return result.rows;
    }),
});

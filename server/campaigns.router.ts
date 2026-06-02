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

          -- Gastos reais do Meta
          COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) as "totalSpend",
          COALESCE(SUM(am.impressions), 0) as "totalImpressions",
          COALESCE(SUM(am.clicks), 0) as "totalClicks",

          -- Receita de conversões (purchase value do Meta Pixel)
          COALESCE(SUM(am."conversionValue"), 0) as "totalSales",
          COALESCE(SUM(am."purchaseCount"), 0) as "totalSalesCount",

          -- CTR e CPM
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
        LEFT JOIN "adMetrics" am ON am."adId" = a.id

        WHERE c."companyId" = $1
        ${input.status ? 'AND c.status = $2' : ''}

        GROUP BY c.id, c."metaCampaignId", c.name, c.status, c.objective, c."dailyBudget", c."lifetimeBudget", c."startDate", c."endDate"
        ORDER BY "totalSpend" DESC
        `,
        input.status ? [input.companyId, input.status] : [input.companyId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        metaCampaignId: row.metaCampaignId,
        name: row.name,
        status: row.status,
        objective: row.objective,

        // Métricas — spend em centavos, sales em BRL
        totalSpend: parseFloat(row.totalSpend || "0") / 100,  // centavos → BRL
        totalImpressions: parseInt(row.totalImpressions || "0"),
        totalClicks: parseInt(row.totalClicks || "0"),
        totalSales: parseFloat(row.totalSales || "0"),        // já em BRL (Meta retorna BRL)
        totalSalesCount: parseInt(row.totalSalesCount || "0"),

        // Calculados (spend e sales agora em BRL)
        roi: row.totalSpend > 0
          ? ((parseFloat(row.totalSales || "0") - parseFloat(row.totalSpend || "0") / 100)
              / (parseFloat(row.totalSpend || "0") / 100) * 100)
          : 0,
        cpa: row.totalSalesCount > 0
          ? (parseFloat(row.totalSpend || "0") / 100) / parseInt(row.totalSalesCount || "0")
          : 0,
        ctr: parseFloat(row.ctr || "0"),
        cpm: parseFloat(row.cpm || "0"),
      }));
    }),

  /**
   * Receita/cliques rastreados por NOME de campanha (link UTM → venda real).
   * Junta os links de `utmTracking` (cliques) com as vendas de `trackedSales`
   * agrupando por `utmCampaign`. A chave de casamento é o nome da campanha
   * (lowercase/trim) — bate com o nome da campanha do Meta na tela.
   */
  trackedByCampaign: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Links UTM + cliques por nome de campanha
      const linksResult = await executeQuery(
        `SELECT lower(trim("utmCampaign")) AS key,
                MAX("utmCampaign") AS name,
                COUNT(*) AS link_count,
                COALESCE(SUM("clickCount"), 0) AS clicks
         FROM "utmTracking"
         WHERE "companyId" = $1 AND "utmCampaign" IS NOT NULL AND trim("utmCampaign") <> ''
         GROUP BY lower(trim("utmCampaign"))`,
        [input.companyId]
      );

      // Vendas rastreadas por nome de campanha (filtro de período opcional)
      const params: any[] = [input.companyId];
      let dateFilter = "";
      if (input.startDate && input.endDate) {
        dateFilter = `AND "saleDate"::date BETWEEN $2 AND $3`;
        params.push(input.startDate, input.endDate);
      }
      const salesResult = await executeQuery(
        `SELECT lower(trim("utmCampaign")) AS key,
                COUNT(*) AS sales_count,
                COALESCE(SUM("orderValue"), 0) AS revenue
         FROM "trackedSales"
         WHERE "companyId" = $1 AND "utmCampaign" IS NOT NULL AND trim("utmCampaign") <> '' ${dateFilter}
         GROUP BY lower(trim("utmCampaign"))`,
        params
      );

      // Mescla os dois conjuntos por chave
      const map: Record<string, any> = {};
      for (const r of linksResult.rows) {
        map[r.key] = {
          key: r.key,
          name: r.name,
          linkCount: parseInt(r.link_count || "0"),
          clicks: parseInt(r.clicks || "0"),
          salesCount: 0,
          revenue: 0,
        };
      }
      for (const r of salesResult.rows) {
        const existing = map[r.key] || { key: r.key, name: r.key, linkCount: 0, clicks: 0 };
        existing.salesCount = parseInt(r.sales_count || "0");
        existing.revenue = parseFloat(r.revenue || "0");
        map[r.key] = existing;
      }

      return Object.values(map);
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

          -- Gastos e métricas (spend em centavos)
          COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) as "totalSpend",
          COALESCE(SUM(am.impressions), 0) as "totalImpressions",
          COALESCE(SUM(am.clicks), 0) as "totalClicks",

          -- Receita de conversões do Meta Pixel (em BRL)
          COALESCE(SUM(am."conversionValue"), 0) as "totalSales",
          COALESCE(SUM(am."purchaseCount"), 0) as "totalSalesCount"

        FROM "metaAdsets" ads
        LEFT JOIN "metaAds" a ON a."adsetId" = ads.id
        LEFT JOIN "adMetrics" am ON am."adId" = a.id

        WHERE ads."campaignId" = $1

        GROUP BY ads.id, ads."metaAdsetId", ads.name, ads.status, ads.budget
        ORDER BY "totalSpend" DESC
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

              -- Gastos e métricas (spend em centavos)
              COALESCE(SUM(CAST(am.spend AS BIGINT)), 0) as "totalSpend",
              COALESCE(SUM(am.impressions), 0) as "totalImpressions",
              COALESCE(SUM(am.clicks), 0) as "totalClicks",

              -- Receita de conversões do Meta Pixel (em BRL)
              COALESCE(SUM(am."conversionValue"), 0) as "totalSales",
              COALESCE(SUM(am."purchaseCount"), 0) as "totalSalesCount"

            FROM "metaAds" a
            LEFT JOIN "adMetrics" am ON am."adId" = a.id

            WHERE a."adsetId" = $1

            GROUP BY a.id, a."metaAdId", a.name, a.status, a."creativeName"
            ORDER BY "totalSpend" DESC
            `,
            [adset.id]
          );

          return {
            id: adset.id,
            metaAdsetId: adset.metaAdsetId,
            name: adset.name,
            status: adset.status,
            budget: adset.budget,

            totalSpend: parseFloat(adset.totalSpend || "0") / 100,  // centavos → BRL
            totalImpressions: parseInt(adset.totalImpressions || "0"),
            totalClicks: parseInt(adset.totalClicks || "0"),
            totalSales: parseFloat(adset.totalSales || "0"),          // já em BRL
            totalSalesCount: parseInt(adset.totalSalesCount || "0"),

            roi: adset.totalSpend > 0
              ? ((parseFloat(adset.totalSales || "0") - parseFloat(adset.totalSpend || "0") / 100)
                  / (parseFloat(adset.totalSpend || "0") / 100) * 100)
              : 0,
            cpa: adset.totalSalesCount > 0
              ? (parseFloat(adset.totalSpend || "0") / 100) / parseInt(adset.totalSalesCount || "0")
              : 0,

            ads: adsResult.rows.map((ad: any) => ({
              id: ad.id,
              metaAdId: ad.metaAdId,
              name: ad.name,
              status: ad.status,
              creativeName: ad.creativeName,

              totalSpend: parseFloat(ad.totalSpend || "0") / 100,    // centavos → BRL
              totalImpressions: parseInt(ad.totalImpressions || "0"),
              totalClicks: parseInt(ad.totalClicks || "0"),
              totalSales: parseFloat(ad.totalSales || "0"),           // já em BRL
              totalSalesCount: parseInt(ad.totalSalesCount || "0"),

              roi: ad.totalSpend > 0
                ? ((parseFloat(ad.totalSales || "0") - parseFloat(ad.totalSpend || "0") / 100)
                    / (parseFloat(ad.totalSpend || "0") / 100) * 100)
                : 0,
              cpa: ad.totalSalesCount > 0
                ? (parseFloat(ad.totalSpend || "0") / 100) / parseInt(ad.totalSalesCount || "0")
                : 0,
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

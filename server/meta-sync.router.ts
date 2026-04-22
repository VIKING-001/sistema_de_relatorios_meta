import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getRawPool } from "./db";
import { TRPCError } from "@trpc/server";

// ─── Database helper ───────────────────────────────────────────────────────
async function executeQuery(sql: string, params: any[] = []) {
  const pool = await getRawPool();
  if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha na conexão" });
  return pool.query(sql, params);
}

// ─── Meta API Helpers ──────────────────────────────────────────────────────

async function fetchMetaCampaigns(
  accountId: string,
  accessToken: string
): Promise<
  Array<{
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
    lifetime_budget?: string;
    start_time?: string;
    stop_time?: string;
  }>
> {
  try {
    const url = new URL(`https://graph.facebook.com/v19.0/${accountId}/campaigns`);
    url.searchParams.set(
      "fields",
      "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time"
    );
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      throw new Error(`Meta API: ${data.error.message}`);
    }

    return data.data || [];
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    throw err;
  }
}

async function fetchMetaAdsets(
  campaignId: string,
  accessToken: string
): Promise<
  Array<{
    id: string;
    name: string;
    status: string;
    budget?: string;
  }>
> {
  try {
    const url = new URL(`https://graph.facebook.com/v19.0/${campaignId}/adsets`);
    url.searchParams.set("fields", "id,name,status,budget");
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      throw new Error(`Meta API: ${data.error.message}`);
    }

    return data.data || [];
  } catch (err) {
    console.error("Error fetching adsets:", err);
    throw err;
  }
}

async function fetchMetaAds(
  adsetId: string,
  accessToken: string
): Promise<
  Array<{
    id: string;
    name: string;
    status: string;
    creative?: {
      id: string;
      name?: string;
    };
  }>
> {
  try {
    const url = new URL(`https://graph.facebook.com/v19.0/${adsetId}/ads`);
    url.searchParams.set("fields", "id,name,status,creative");
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      throw new Error(`Meta API: ${data.error.message}`);
    }

    return data.data || [];
  } catch (err) {
    console.error("Error fetching ads:", err);
    throw err;
  }
}

// ─── Router ────────────────────────────────────────────────────────────────

export const metaSyncRouter = router({
  /**
   * Sincronizar campanhas, adsets e anúncios do Meta
   * Puxa dados da Meta API e insere/atualiza no banco
   */
  syncCampaigns: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão à empresa e se tem token Meta
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!company.metaAccessToken || !company.metaAdAccountId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Empresa não conectada ao Meta Ads ou conta de anúncio não selecionada",
        });
      }

      const accountId = company.metaAdAccountId.startsWith("act_")
        ? company.metaAdAccountId
        : `act_${company.metaAdAccountId}`;

      let synced = {
        campaigns: 0,
        adsets: 0,
        ads: 0,
        errors: [] as string[],
      };

      try {
        // 1. Buscar campanhas
        console.log(`[Meta Sync] Fetching campaigns for ${accountId}...`);
        const campaigns = await fetchMetaCampaigns(accountId, company.metaAccessToken);

        for (const campaign of campaigns) {
          try {
            // Inserir ou atualizar campanha
            const campaignResult = await executeQuery(
              `
              INSERT INTO "metaCampaigns" (
                "companyId", "userId", "metaCampaignId", "name", "status", "objective",
                "dailyBudget", "lifetimeBudget", "startDate", "endDate"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT ("metaCampaignId") DO UPDATE SET
                "name" = EXCLUDED."name",
                "status" = EXCLUDED."status",
                "objective" = EXCLUDED."objective",
                "dailyBudget" = EXCLUDED."dailyBudget",
                "lifetimeBudget" = EXCLUDED."lifetimeBudget",
                "startDate" = EXCLUDED."startDate",
                "endDate" = EXCLUDED."endDate",
                "updatedAt" = NOW()
              RETURNING id
              `,
              [
                input.companyId,
                userId,
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.objective,
                campaign.daily_budget ? Math.floor(parseFloat(campaign.daily_budget) * 100) : null,
                campaign.lifetime_budget ? Math.floor(parseFloat(campaign.lifetime_budget) * 100) : null,
                campaign.start_time ? new Date(campaign.start_time) : null,
                campaign.stop_time ? new Date(campaign.stop_time) : null,
              ]
            );

            const campaignDbId = campaignResult.rows[0].id;
            synced.campaigns++;

            // 2. Buscar adsets para esta campanha
            console.log(`[Meta Sync] Fetching adsets for campaign ${campaign.id}...`);
            const adsets = await fetchMetaAdsets(campaign.id, company.metaAccessToken);

            for (const adset of adsets) {
              try {
                // Inserir ou atualizar adset
                const adsetResult = await executeQuery(
                  `
                  INSERT INTO "metaAdsets" (
                    "companyId", "userId", "campaignId", "metaAdsetId", "name", "status", "budget"
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT ("metaAdsetId") DO UPDATE SET
                    "name" = EXCLUDED."name",
                    "status" = EXCLUDED."status",
                    "budget" = EXCLUDED."budget",
                    "updatedAt" = NOW()
                  RETURNING id
                  `,
                  [
                    input.companyId,
                    userId,
                    campaignDbId,
                    adset.id,
                    adset.name,
                    adset.status,
                    adset.budget ? Math.floor(parseFloat(adset.budget) * 100) : null,
                  ]
                );

                const adsetDbId = adsetResult.rows[0].id;
                synced.adsets++;

                // 3. Buscar anúncios para este adset
                console.log(`[Meta Sync] Fetching ads for adset ${adset.id}...`);
                const ads = await fetchMetaAds(adset.id, company.metaAccessToken);

                for (const ad of ads) {
                  try {
                    // Inserir ou atualizar anúncio
                    await executeQuery(
                      `
                      INSERT INTO "metaAds" (
                        "companyId", "userId", "adsetId", "campaignId", "metaAdId", "name", "status", "creativeName"
                      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                      ON CONFLICT ("metaAdId") DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "status" = EXCLUDED."status",
                        "creativeName" = EXCLUDED."creativeName",
                        "updatedAt" = NOW()
                      `,
                      [
                        input.companyId,
                        userId,
                        adsetDbId,
                        campaignDbId,
                        ad.id,
                        ad.name,
                        ad.status,
                        ad.creative?.name || ad.creative?.id || null,
                      ]
                    );

                    synced.ads++;
                  } catch (err: any) {
                    synced.errors.push(`Ad ${ad.id}: ${err.message}`);
                  }
                }
              } catch (err: any) {
                synced.errors.push(`Adset ${adset.id}: ${err.message}`);
              }
            }
          } catch (err: any) {
            synced.errors.push(`Campaign ${campaign.id}: ${err.message}`);
          }
        }

        console.log(`[Meta Sync] Complete: ${synced.campaigns} campaigns, ${synced.adsets} adsets, ${synced.ads} ads`);

        return {
          success: true,
          message: `Sincronizado: ${synced.campaigns} campanhas, ${synced.adsets} adsets, ${synced.ads} anúncios`,
          synced,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao sincronizar: ${err.message}`,
        });
      }
    }),

  /**
   * Sincronizar métricas de anúncios para um período
   * Puxa dados de gastos, impressões, cliques, conversões
   */
  syncMetrics: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!company.metaAccessToken || !company.metaAdAccountId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Empresa não conectada ao Meta Ads",
        });
      }

      const accountId = company.metaAdAccountId.startsWith("act_")
        ? company.metaAdAccountId
        : `act_${company.metaAdAccountId}`;

      try {
        // Buscar anúncios da empresa
        const adsResult = await executeQuery(
          `SELECT id, "metaAdId", "adsetId", "campaignId" FROM "metaAds" WHERE "companyId" = $1 LIMIT 1000`,
          [input.companyId]
        );

        const ads = adsResult.rows;
        let metricsInserted = 0;

        // Para cada anúncio, buscar métricas do Meta API
        for (const ad of ads) {
          try {
            const url = new URL(`https://graph.facebook.com/v19.0/${ad.metaAdId}/insights`);
            url.searchParams.set("fields", "spend,impressions,clicks,actions");
            url.searchParams.set("action_breakdown", "action_type");
            url.searchParams.set("time_range", JSON.stringify({ since: input.startDate, until: input.endDate }));
            url.searchParams.set("access_token", company.metaAccessToken);

            const res = await fetch(url.toString());
            const data = await res.json();

            if (data.data && data.data[0]) {
              const metrics = data.data[0];

              // Contar conversões dos actions
              let conversions = 0;
              if (metrics.actions) {
                const purchase = metrics.actions.find((a: any) => a.action_type === "purchase");
                if (purchase) {
                  conversions = parseInt(purchase.value || "0");
                }
              }

              // Inserir ou atualizar métrica
              await executeQuery(
                `
                INSERT INTO "adMetrics" (
                  "adId", "adsetId", "campaignId", "companyId",
                  date, spend, impressions, clicks, conversions
                ) VALUES ($1, $2, $3, $4, NOW()::date, $5, $6, $7, $8)
                ON CONFLICT ("adId", date) DO UPDATE SET
                  spend = EXCLUDED.spend,
                  impressions = EXCLUDED.impressions,
                  clicks = EXCLUDED.clicks,
                  conversions = EXCLUDED.conversions,
                  "updatedAt" = NOW()
                `,
                [
                  ad.id,
                  ad.adsetId,
                  ad.campaignId,
                  input.companyId,
                  Math.floor(parseFloat(metrics.spend || "0") * 100),
                  parseInt(metrics.impressions || "0"),
                  parseInt(metrics.clicks || "0"),
                  conversions,
                ]
              );

              metricsInserted++;
            }
          } catch (err: any) {
            console.error(`Error syncing metrics for ad ${ad.metaAdId}:`, err.message);
          }
        }

        return {
          success: true,
          message: `Sincronizadas métricas de ${metricsInserted} anúncios para ${input.startDate} a ${input.endDate}`,
          metricsInserted,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao sincronizar métricas: ${err.message}`,
        });
      }
    }),
});

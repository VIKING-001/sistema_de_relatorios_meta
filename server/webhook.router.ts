import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getRawPool } from "./db";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// ─── Database query helper ──────────────────────────────────────────────────
async function executeQuery(sql: string, params: any[] = []) {
  const pool = await getRawPool();
  if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return pool.query(sql, params);
}

// ─── Validações ────────────────────────────────────────────────────────────

const createWebhookSchema = z.object({
  companyId: z.number().int().positive(),
  platform: z.enum([
    "shopify", "woocommerce", "custom", "zapier",
    "hotmart", "kiwify", "cartpanda", "vega1", "kirvano",
    "perfectpay", "yampi", "lastlink", "payt", "logzz",
    "adoorel", "tribopay", "clickbank", "ticto", "eduzz",
    "braip", "pepper", "buygoods", "mundpay", "disrupty",
    "greenn", "monetizze", "guru", "digistore", "hubla",
    "doppus", "frendz", "invictuspay", "appmax", "nitropagamentos",
    "goatpay"
  ]),
});

const updateWebhookStatusSchema = z.object({
  webhookId: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

// ─── Router ────────────────────────────────────────────────────────────────

export const webhookRouter = router({
  /**
   * Criar uma nova configuração de webhook
   * POST /api/trpc/webhook.create
   */
  create: protectedProcedure
    .input(createWebhookSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Validar permissão à empresa
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa" });
      }

      // Gerar secret para validação HMAC
      const webhookSecret = crypto.randomBytes(32).toString("hex");

      // Construir URL do webhook baseado na plataforma
      const baseUrl = "https://sistemaderelatoriosmetaof.vercel.app";
      const webhookUrl = `${baseUrl}/webhook/${input.platform}?companyId=${input.companyId}`;

      // Inserir no banco
      const result = await executeQuery(
        `INSERT INTO "webhookConfigs" (
          "companyId", "userId", "platform", "webhookUrl", "webhookSecret", "status"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          input.companyId,
          userId,
          input.platform,
          webhookUrl,
          webhookSecret,
          "active",
        ]
      );

      return result.rows[0];
    }),

  /**
   * Listar todos os webhooks de uma empresa
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

      const result = await executeQuery(
        `SELECT * FROM "webhookConfigs"
         WHERE "companyId" = $1
         ORDER BY "createdAt" DESC`,
        [input.companyId]
      );

      return result.rows;
    }),

  /**
   * Atualizar status de um webhook (ativo/inativo)
   */
  updateStatus: protectedProcedure
    .input(updateWebhookStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão
      const webhookResult = await executeQuery(
        `SELECT * FROM "webhookConfigs" WHERE "id" = $1`,
        [input.webhookId]
      );

      if (webhookResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      const webhook = webhookResult.rows[0];

      // Verificar se o webhook pertence a uma empresa do usuário
      const company = await db.getCompanyById(webhook.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Atualizar status
      const result = await executeQuery(
        `UPDATE "webhookConfigs"
         SET "status" = $1, "updatedAt" = NOW()
         WHERE "id" = $2
         RETURNING *`,
        [input.status, input.webhookId]
      );

      return result.rows[0];
    }),

  /**
   * Deletar um webhook
   */
  delete: protectedProcedure
    .input(z.object({ webhookId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão
      const webhookResult = await executeQuery(
        `SELECT * FROM "webhookConfigs" WHERE "id" = $1`,
        [input.webhookId]
      );

      if (webhookResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      const webhook = webhookResult.rows[0];

      // Verificar se o webhook pertence a uma empresa do usuário
      const company = await db.getCompanyById(webhook.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Deletar webhook
      await executeQuery(
        `DELETE FROM "webhookConfigs" WHERE "id" = $1`,
        [input.webhookId]
      );

      return { success: true };
    }),

  /**
   * Obter detalhes de um webhook específico
   */
  get: protectedProcedure
    .input(z.object({ webhookId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const webhookResult = await executeQuery(
        `SELECT * FROM "webhookConfigs" WHERE "id" = $1`,
        [input.webhookId]
      );

      if (webhookResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      const webhook = webhookResult.rows[0];

      // Verificar se o webhook pertence a uma empresa do usuário
      const company = await db.getCompanyById(webhook.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      return webhook;
    }),

  /**
   * Obter estatísticas de um webhook (quantos webhooks foram disparados, etc)
   */
  getStats: protectedProcedure
    .input(z.object({ webhookId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão
      const webhookResult = await executeQuery(
        `SELECT * FROM "webhookConfigs" WHERE "id" = $1`,
        [input.webhookId]
      );

      if (webhookResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      const webhook = webhookResult.rows[0];

      // Verificar se o webhook pertence a uma empresa do usuário
      const company = await db.getCompanyById(webhook.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Contar vendas rastreadas via este webhook
      const statsResult = await executeQuery(
        `SELECT
          COUNT(*) as total_webhook_calls,
          SUM(CASE WHEN "trackingId" IS NOT NULL THEN 1 ELSE 0 END) as tracked_sales,
          SUM("orderValue") as total_revenue
         FROM "trackedSales"
         WHERE "companyId" = $1 AND "source" = $2`,
        [webhook.companyId, webhook.platform]
      );

      const stats = statsResult.rows[0];

      return {
        totalWebhookCalls: parseInt(stats.total_webhook_calls || "0"),
        trackedSales: parseInt(stats.tracked_sales || "0"),
        totalRevenue: parseFloat(stats.total_revenue || "0"),
      };
    }),
});

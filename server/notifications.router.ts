import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { checkBalanceCandidate } from "./cron/balanceService";

export const notificationsRouter = router({
  /** Devolve a VAPID public key para o frontend criar a PushSubscription */
  getPublicKey: publicProcedure.query(() => {
    return { vapidPublicKey: ENV.vapidPublicKey || process.env.VITE_VAPID_PUBLIC_KEY || "" };
  }),

  /** Salva ou atualiza a subscription de push do dispositivo atual */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string().min(10),
        auth: z.string().min(5),
        companyId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      await db.upsertPushSubscription(
        userId,
        input.endpoint,
        input.p256dh,
        input.auth,
        input.companyId ?? null
      );
      return { success: true };
    }),

  /** Remove a subscription do dispositivo atual */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      await db.deletePushSubscription(input.endpoint);
      return { success: true };
    }),

  /** Configura o alerta de saldo de uma empresa */
  setBalanceAlert: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        thresholdReais: z.number().min(0).max(100000),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const thresholdCents = Math.round(input.thresholdReais * 100);
      await db.upsertBalanceAlert(input.companyId, thresholdCents, input.enabled);
      return { success: true };
    }),

  /** Consulta o saldo agora para confirmar que a integração e o limite estão funcionando. */
  checkBalanceNow: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!company.metaAdAccountId || !company.metaAccessToken) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte a conta de anúncios da Meta primeiro." });
      }

      const alert = await db.getBalanceAlert(input.companyId);
      if (alert?.enabled === false) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ative o alerta antes de verificar o saldo." });
      }

      return checkBalanceCandidate({
        companyId: company.id,
        thresholdCents: alert?.thresholdCents ?? 10000,
        lastNotifiedAt: alert?.lastNotifiedAt ?? null,
        userId: company.userId,
        companyName: company.name,
        metaAdAccountId: company.metaAdAccountId,
        metaAccessToken: company.metaAccessToken,
      });
    }),

  /** Retorna a configuração de alerta de saldo de uma empresa */
  getBalanceAlert: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const alert = await db.getBalanceAlert(input.companyId);
      return {
        thresholdReais: alert ? alert.thresholdCents / 100 : 100,
        enabled: alert?.enabled ?? true,
        lastNotifiedAt: alert?.lastNotifiedAt ?? null,
        lastCheckedAt: alert?.lastCheckedAt ?? null,
        lastBalanceReais: alert?.lastBalanceCents == null ? null : alert.lastBalanceCents / 100,
        lastCheckStatus: alert?.lastCheckStatus ?? null,
        lastCheckMessage: alert?.lastCheckMessage ?? null,
      };
    }),
});

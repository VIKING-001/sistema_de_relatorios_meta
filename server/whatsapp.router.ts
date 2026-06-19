import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Router de WhatsApp Cloud API:
 * - saveConfig: cadastra/atualiza credenciais (phoneNumberId, token, verifyToken)
 * - getConfig:  retorna a config da empresa (token mascarado)
 * - listConversations: lista conversas com atribuição de campanha
 * - summary: total de conversas, atribuídas e convertidas
 */
export const whatsappRouter = router({
  saveConfig: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        phoneNumberId: z.string().min(3),
        wabaId: z.string().optional(),
        displayPhone: z.string().optional(),
        accessToken: z.string().optional(),
        verifyToken: z.string().min(4),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa" });
      }

      const saved = await db.upsertWhatsappConfig({
        companyId: input.companyId,
        userId,
        phoneNumberId: input.phoneNumberId.trim(),
        wabaId: input.wabaId?.trim() || null,
        displayPhone: input.displayPhone?.trim() || null,
        accessToken: input.accessToken?.trim() || null,
        verifyToken: input.verifyToken.trim(),
      });
      return { success: true, config: { id: saved?.id, phoneNumberId: saved?.phoneNumberId } };
    }),

  getConfig: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const cfg = await db.getWhatsappConfigByCompany(input.companyId);
      if (!cfg) return null;
      return {
        phoneNumberId: cfg.phoneNumberId,
        wabaId: cfg.wabaId,
        displayPhone: cfg.displayPhone,
        verifyToken: cfg.verifyToken,
        hasToken: !!cfg.accessToken,
        status: cfg.status,
      };
    }),

  listConversations: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const rows = await db.listWhatsappConversations(input.companyId);
      const total = rows.length;
      const attributed = rows.filter((r: any) => r.campaignName).length;
      const converted = rows.filter((r: any) => r.status === "converted").length;
      return {
        conversations: rows,
        summary: { total, attributed, converted },
      };
    }),
});

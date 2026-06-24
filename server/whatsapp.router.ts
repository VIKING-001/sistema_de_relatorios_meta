import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

const GRAPH = "https://graph.facebook.com/v21.0";

/** Troca o `code` do Embedded Signup por um token de acesso (system user do negócio). */
async function exchangeEmbeddedSignupCode(code: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", ENV.metaAppId);
  url.searchParams.set("client_secret", ENV.metaAppSecret);
  url.searchParams.set("code", code);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Falha ao trocar o code do WhatsApp.");
  return data.access_token as string;
}

/** Inscreve o nosso app nos webhooks daquele WABA (passa a receber as mensagens). */
async function subscribeAppToWaba(wabaId: string, token: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Falha ao inscrever o app no WABA.");
}

/** Lê o número exibido do phone_number_id (para mostrar na UI). */
async function getDisplayPhone(phoneNumberId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}?fields=display_phone_number`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data?.display_phone_number ?? null;
  } catch {
    return null;
  }
}

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

  /**
   * Finaliza a conexão "1 clique" (Meta Embedded Signup): troca o code por token,
   * inscreve o app nos webhooks do WABA e salva a config automaticamente.
   */
  finishEmbeddedSignup: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        code: z.string().min(5),
        phoneNumberId: z.string().min(3),
        wabaId: z.string().min(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa" });
      }

      if (!ENV.metaAppId || !ENV.metaAppSecret) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "META_APP_ID/META_APP_SECRET não configurados no servidor.",
        });
      }

      try {
        const token = await exchangeEmbeddedSignupCode(input.code);
        await subscribeAppToWaba(input.wabaId, token);
        const displayPhone = await getDisplayPhone(input.phoneNumberId, token);

        const saved = await db.upsertWhatsappConfig({
          companyId: input.companyId,
          userId,
          phoneNumberId: input.phoneNumberId,
          wabaId: input.wabaId,
          displayPhone,
          accessToken: token,
          verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || `auto-${input.phoneNumberId}`,
        });

        console.log(`[WhatsApp] Embedded Signup OK — empresa ${input.companyId}, número ${input.phoneNumberId}`);
        return {
          success: true,
          config: { phoneNumberId: saved?.phoneNumberId, wabaId: saved?.wabaId, displayPhone },
        };
      } catch (err: any) {
        console.error("[WhatsApp] Embedded Signup falhou:", err?.message || err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Falha ao finalizar a conexão do WhatsApp.",
        });
      }
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

  disconnect: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteWhatsappConfig(input.companyId);
      return { success: true };
    }),

  listMessages: protectedProcedure
    .input(z.object({
      companyId: z.number().int().positive(),
      waId: z.string().min(1),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const messages = await db.listWhatsappMessages(input.companyId, input.waId);
      return { messages };
    }),
});

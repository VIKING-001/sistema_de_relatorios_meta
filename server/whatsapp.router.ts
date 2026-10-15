import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { WHATSAPP_CONVERSATION_STAGES, WHATSAPP_EDITABLE_STATUSES } from "../shared/whatsapp";

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
    .input(z.object({
      companyId: z.number().int().positive(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).max(100000).default(0),
      search: z.string().trim().max(120).optional(),
      status: z.enum(["open", "pending", "closed", "converted"]).optional(),
      source: z.enum(["ads", "organic"]).optional(),
      stage: z.enum([...WHATSAPP_CONVERSATION_STAGES, "converted"]).optional(),
      tag: z.string().trim().min(1).max(30).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const [result, summary] = await Promise.all([
        db.listWhatsappConversations(input),
        db.getWhatsappConversationSummary(input.companyId),
      ]);
      return {
        ...result,
        summary,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  listSessions: protectedProcedure
    .input(z.object({
      companyId: z.number().int().positive(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).max(100000).default(0),
      search: z.string().trim().max(120).optional(),
      status: z.enum(["open", "pending", "closed", "converted"]).optional(),
      source: z.enum(["ads", "organic"]).optional(),
      stage: z.enum([...WHATSAPP_CONVERSATION_STAGES, "converted"]).optional(),
      tag: z.string().trim().min(1).max(30).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const [result, summary] = await Promise.all([
        db.listWhatsappSessions(input),
        db.getWhatsappSessionSummary(input.companyId),
      ]);
      return {
        ...result,
        summary,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  updateConversation: protectedProcedure
    .input(z.object({
      companyId: z.number().int().positive(),
      conversationId: z.number().int().positive(),
      status: z.enum(WHATSAPP_EDITABLE_STATUSES).optional(),
      stage: z.enum(WHATSAPP_CONVERSATION_STAGES).optional(),
      tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    }).refine((input) => input.status !== undefined || input.stage !== undefined || input.tags !== undefined, {
      message: "Informe o novo status, etapa ou etiquetas.",
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa" });
      }

      const conversation = await db.updateWhatsappConversation(
        input.companyId,
        input.conversationId,
        {
          status: input.status,
          stage: input.stage,
          tags: input.tags?.filter((tag, index, values) =>
            values.findIndex((value) => value.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR")) === index,
          ),
        },
      );
      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversa não encontrada ou já convertida por uma venda vinculada.",
        });
      }
      return { conversation };
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
      sessionId: z.number().int().positive().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const [messages, replyContext] = await Promise.all([
        input.sessionId
          ? db.listWhatsappSessionMessages(input.companyId, input.waId, input.sessionId)
          : db.listWhatsappMessages(input.companyId, input.waId),
        db.getWhatsappReplyContext(input.companyId, input.waId),
      ]);
      return {
        messages,
        lastInboundAt: replyContext?.lastInboundAt ?? null,
        lastInboundSessionId: replyContext?.lastInboundSessionId ?? null,
      };
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      companyId: z.number().int().positive(),
      waId: z.string().trim().regex(/^\d{8,15}$/, "Número de WhatsApp inválido."),
      sessionId: z.number().int().positive().optional(),
      text: z.string().trim().min(1, "Digite uma mensagem.").max(4096, "A mensagem deve ter até 4.096 caracteres."),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa." });
      }

      const config = await db.getWhatsappConfigByCompany(input.companyId);
      if (!config || config.status !== "active") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte um número ativo do WhatsApp Cloud API antes de responder." });
      }
      if (!config.accessToken) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Esta conexão não tem credencial de envio. Reconecte o WhatsApp pela Meta ou atualize o token de acesso." });
      }

      const replyContext = await db.getWhatsappReplyContext(input.companyId, input.waId);
      if (!replyContext) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Este contato não está registrado nesta empresa." });
      }
      if (!replyContext.lastInboundAt) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ainda não há mensagem recebida deste contato para liberar uma resposta." });
      }

      const now = new Date();
      const lastInboundAt = new Date(replyContext.lastInboundAt).getTime();
      if (!Number.isFinite(lastInboundAt) || lastInboundAt > now.getTime() + 5 * 60 * 1000) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Não foi possível validar o horário da última mensagem recebida. Atualize a conversa e tente novamente." });
      }
      if (now.getTime() - lastInboundAt >= 24 * 60 * 60 * 1000) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A janela de atendimento de 24 horas encerrou. Fora dela, a Meta exige um modelo de mensagem aprovado." });
      }
      if (input.sessionId && Number(replyContext.lastInboundSessionId) !== input.sessionId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este atendimento não é o mais recente. Abra o atendimento mais novo para responder." });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      let response: Response;
      let payload: any;
      try {
        response = await fetch(`${GRAPH}/${config.phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: input.waId,
            type: "text",
            text: { preview_url: false, body: input.text },
          }),
          signal: controller.signal,
        });
        payload = await response.json().catch(() => ({}));
      } catch (error: any) {
        const message = error?.name === "AbortError"
          ? "A Meta demorou para responder. Confira a conversa antes de tentar novamente para evitar duplicar a mensagem."
          : "Não foi possível conectar à API do WhatsApp. Confira a conexão e tente novamente.";
        throw new TRPCError({ code: error?.name === "AbortError" ? "TIMEOUT" : "BAD_GATEWAY", message });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok || payload?.error) {
        const metaMessage = typeof payload?.error?.message === "string" ? payload.error.message.slice(0, 240) : "";
        const message = response.status === 401 || response.status === 403
          ? "A Meta recusou o token ou a permissão de envio. Reconecte o número e confirme a permissão whatsapp_business_messaging."
          : `A Meta não aceitou a mensagem${metaMessage ? `: ${metaMessage}` : ". Confira o número e a configuração do WhatsApp."}`;
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }

      const wamid = payload?.messages?.[0]?.id;
      if (typeof wamid !== "string" || !wamid) {
        console.error("[WhatsApp] Meta aceitou resposta sem retornar wamid; envio não pode ser confirmado no histórico.");
        return { success: true, persisted: false };
      }

      let persisted = false;
      try {
        const saved = await db.recordWhatsappOutboundMessage({
          companyId: input.companyId,
          waId: input.waId,
          wamid,
          type: "text",
          text: input.text,
          timestamp: now,
        });
        persisted = !!saved?.message || !!saved?.duplicate;
      } catch (error: any) {
        console.error("[WhatsApp] Mensagem aceita pela Meta, mas falhou a gravação local:", error?.message || error);
      }

      if (persisted) {
        await db.logWebhookEvent({
          companyId: input.companyId,
          platform: "whatsapp",
          success: true,
          message: "Resposta enviada pelo painel",
          payloadSummary: "Mensagem de texto enviada pela equipe",
        }).catch((error: any) => {
          console.error("[WhatsApp] Não foi possível registrar o evento de envio:", error?.message || error);
        });
      }

      return { success: true, persisted };
    }),
});

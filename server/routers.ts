import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { calculateCPM, calculateCTR } from "../shared/metrics";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { loginUser, registerUser, signSessionJwt } from "./_core/localAuth";

// Validação de entrada para empresa
const createCompanySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  description: z.string().optional(),
});

// Validação de entrada para relatório
const createReportSchema = z.object({
  companyId: z.number().int().positive(),
  title: z.string().min(1, "Título do relatório é obrigatório"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
});

// Validação de entrada para métricas
const metricsSchema = z.object({
  instagramReach: z.number().int().min(0).default(0),
  totalReach: z.number().int().min(0).default(0),
  totalImpressions: z.number().int().min(0).default(0),
  instagramProfileVisits: z.number().int().min(0).default(0),
  newInstagramFollowers: z.number().int().min(0).default(0),
  messagesInitiated: z.number().int().min(0).default(0),
  totalSpent: z.number().min(0).default(0),
  totalClicks: z.number().int().min(0).default(0),
  costPerClick: z.number().min(0).default(0),
  videoRetentionRate: z.number().min(0).max(100).default(0),
  profileVisitsThroughCampaigns: z.number().int().min(0).default(0),
  costPerProfileVisit: z.number().min(0).default(0),
  cpm: z.number().min(0).default(0),
  ctr: z.number().min(0).max(100).default(0),
  // Conversões / Compras
  purchases: z.number().int().min(0).default(0),
  purchaseValue: z.number().min(0).default(0),
  costPerPurchase: z.number().min(0).default(0),
  costPerMessage: z.number().min(0).default(0),
}).transform((data) => ({
  ...data,
  totalSpent: data.totalSpent.toString(),
  costPerClick: data.costPerClick.toString(),
  videoRetentionRate: data.videoRetentionRate.toString(),
  costPerProfileVisit: data.costPerProfileVisit.toString(),
  cpm: data.cpm.toString(),
  ctr: data.ctr.toString(),
  purchaseValue: data.purchaseValue.toString(),
  costPerPurchase: data.costPerPurchase.toString(),
  costPerMessage: data.costPerMessage.toString(),
}));

// ─── Meta Marketing API helpers ───────────────────────────────────────────────

async function fetchMetaInsights(
  adAccountId: string,
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const timeRange = JSON.stringify({ since: startDate, until: endDate });

  // 1. Insights gerais da conta
  const baseUrl = `https://graph.facebook.com/v19.0/${accountId}/insights`;
  const params = new URLSearchParams({
    fields: "reach,impressions,spend,clicks,cpc,cpm,ctr,actions,action_values",
    time_range: timeRange,
    level: "account",
    access_token: accessToken,
  });

  const res = await fetch(`${baseUrl}?${params}`);
  const json = await res.json();

  if (json.error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Erro Meta API: ${json.error.message}`,
    });
  }

  // Se não houver dados, retorna zeros (sem erro) — usuário preenche manualmente
  if (!json.data || json.data.length === 0) {
    return {
      totalReach: 0,
      instagramReach: 0,
      totalImpressions: 0,
      instagramProfileVisits: 0,
      newInstagramFollowers: 0,
      messagesInitiated: 0,
      totalSpent: 0,
      totalClicks: 0,
      costPerClick: 0,
      videoRetentionRate: 0,
      profileVisitsThroughCampaigns: 0,
      costPerProfileVisit: 0,
      purchases: 0,
      purchaseValue: 0,
      costPerPurchase: 0,
      costPerMessage: 0,
      _warning: "Nenhum dado encontrado para o período selecionado. Os campos foram zerados — verifique o período ou preencha manualmente.",
    };
  }

  const ins = json.data[0];

  const getAction = (actions: any[], type: string): number => {
    const a = (actions || []).find((x: any) => x.action_type === type);
    return a ? Math.round(parseFloat(a.value)) : 0;
  };

  const actions = ins.actions || [];
  const actionValues = ins.action_values || [];

  const getActionValue = (av: any[], type: string): number => {
    const a = (av || []).find((x: any) => x.action_type === type);
    return a ? parseFloat(a.value) : 0;
  };

  const messagesInitiated =
    getAction(actions, "onsite_conversion.messaging_conversation_started_7d") ||
    getAction(actions, "onsite_conversion.messaging_first_reply") ||
    getAction(actions, "onsite_conversion.total_messaging_connection") ||
    0;

  // Compras / Conversões
  const purchases =
    getAction(actions, "offsite_conversion.fb_pixel_purchase") ||
    getAction(actions, "purchase") ||
    getAction(actions, "omni_purchase") ||
    0;

  const purchaseValue =
    getActionValue(actionValues, "offsite_conversion.fb_pixel_purchase") ||
    getActionValue(actionValues, "purchase") ||
    getActionValue(actionValues, "omni_purchase") ||
    0;

  // 2. Breakdown por publisher_platform para métricas do Instagram
  let instagramReach = 0;
  let instagramProfileVisits = 0;
  let newInstagramFollowers = 0;
  let profileVisitsThroughCampaigns = 0;

  try {
    const igParams = new URLSearchParams({
      fields: "reach,actions",
      time_range: timeRange,
      level: "account",
      breakdowns: "publisher_platform",
      access_token: accessToken,
    });
    const igRes = await fetch(`${baseUrl}?${igParams}`);
    const igJson = await igRes.json();

    if (igJson.data) {
      const igRow = igJson.data.find((d: any) => d.publisher_platform === "instagram");
      if (igRow) {
        instagramReach = parseInt(igRow.reach || "0", 10);
        const igActions = igRow.actions || [];
        instagramProfileVisits =
          getAction(igActions, "profile_visit") ||
          getAction(igActions, "view_content") ||
          0;
        newInstagramFollowers =
          getAction(igActions, "like") ||
          getAction(igActions, "page_engagement") ||
          0;
        profileVisitsThroughCampaigns = instagramProfileVisits;
      }
    }
  } catch (_e) {
    // Breakdown é opcional — ignora erro silenciosamente
  }

  const totalSpent = parseFloat(ins.spend || "0");
  const totalImpressions = parseInt(ins.impressions || "0", 10);
  const totalClicks = parseInt(ins.clicks || "0", 10);

  return {
    totalReach: parseInt(ins.reach || "0", 10),
    totalImpressions,
    totalSpent,
    totalClicks,
    costPerClick: parseFloat(ins.cpc || "0"),
    cpm: parseFloat(ins.cpm || "0"),
    ctr: parseFloat(ins.ctr || "0"),
    instagramReach,
    instagramProfileVisits,
    profileVisitsThroughCampaigns,
    newInstagramFollowers,
    messagesInitiated,
    videoRetentionRate: 0,
    costPerProfileVisit:
      instagramProfileVisits > 0
        ? parseFloat((totalSpent / instagramProfileVisits).toFixed(2))
        : 0,
    purchases,
    purchaseValue: parseFloat(purchaseValue.toFixed(2)),
    costPerPurchase:
      purchases > 0 ? parseFloat((totalSpent / purchases).toFixed(2)) : 0,
    costPerMessage:
      messagesInitiated > 0 ? parseFloat((totalSpent / messagesInitiated).toFixed(2)) : 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await loginUser(input.email, input.password);
          const token = await signSessionJwt(user.openId, user.name ?? user.email ?? "User");
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
          return { success: true, user };
        } catch (err: any) {
          if (err.message === "INVALID_CREDENTIALS") {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao fazer login" });
        }
      }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await registerUser(input.email, input.password, input.name);
          const token = await signSessionJwt(user.openId, user.name ?? user.email ?? "User");
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
          return { success: true, user };
        } catch (err: any) {
          if (err.message === "EMAIL_ALREADY_EXISTS") {
            throw new TRPCError({ code: "CONFLICT", message: "Este email já está cadastrado" });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar conta" });
        }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Company procedures
  company: router({
    create: protectedProcedure
      .input(createCompanySchema)
      .mutation(async ({ ctx, input }) => {
        const company = await db.createCompany(ctx.user.id, input.name, input.description);
        return company;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const companies = await db.getCompaniesByUserId(ctx.user.id);
        return companies;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.id);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
        }
        return company;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        ...createCompanySchema.shape,
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.id);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        const updated = await db.updateCompany(input.id, input.name, input.description);
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.id);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        await db.deleteCompany(input.id);
        return { success: true };
      }),
  }),

  // Report procedures
  report: router({
    create: protectedProcedure
      .input(createReportSchema.extend({
        metrics: metricsSchema.optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se a empresa pertence ao usuário
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // Gerar slug único
        const slug = `${input.title.toLowerCase().replace(/\s+/g, "-")}-${nanoid(8)}`;

        // Criar relatório
        const report = await db.createReport(
          input.companyId,
          ctx.user.id,
          input.title,
          slug,
          input.startDate,
          input.endDate,
          input.description
        );

        // Criar métricas se fornecidas
        if (input.metrics) {
          const cpm = calculateCPM(parseFloat(input.metrics.totalSpent), input.metrics.totalImpressions);
          const ctr = calculateCTR(input.metrics.totalClicks, input.metrics.totalImpressions);

          await db.createReportMetrics(report.id, {
            ...input.metrics,
            cpm: cpm.toString(),
            ctr: ctr.toString(),
            totalSpent: input.metrics.totalSpent.toString(),
            costPerClick: input.metrics.costPerClick.toString(),
            videoRetentionRate: input.metrics.videoRetentionRate.toString(),
            costPerProfileVisit: input.metrics.costPerProfileVisit.toString(),
          });
        }

        return report;
      }),

    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getReportsWithMetricsByUserId(ctx.user.id);
      }),

    list: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        // Verificar se a empresa pertence ao usuário
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const reports = await db.getReportsByCompanyId(input.companyId);
        return reports;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const report = await db.getReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
        }

        const metrics = await db.getMetricsByReportId(report.id);
        return { report, metrics };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isPublished: z.enum(["draft", "published"]).optional(),
        metrics: metricsSchema.optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // Atualizar relatório
        const updated = await db.updateReport(
          input.id,
          input.title ?? report.title,
          report.slug,
          input.startDate ?? report.startDate,
          input.endDate ?? report.endDate,
          input.description || undefined,
          input.isPublished ?? report.isPublished
        );

        // Atualizar métricas se fornecidas
        if (input.metrics) {
          const cpm = calculateCPM(parseFloat(input.metrics.totalSpent), input.metrics.totalImpressions);
          const ctr = calculateCTR(input.metrics.totalClicks, input.metrics.totalImpressions);

          const existingMetrics = await db.getMetricsByReportId(input.id);
          if (existingMetrics) {
            await db.updateReportMetrics(input.id, {
              ...input.metrics,
              cpm: cpm.toString(),
              ctr: ctr.toString(),
              totalSpent: input.metrics.totalSpent.toString(),
              costPerClick: input.metrics.costPerClick.toString(),
              videoRetentionRate: input.metrics.videoRetentionRate.toString(),
              costPerProfileVisit: input.metrics.costPerProfileVisit.toString(),
            });
          } else {
            await db.createReportMetrics(input.id, {
              ...input.metrics,
              cpm: cpm.toString(),
              ctr: ctr.toString(),
              totalSpent: input.metrics.totalSpent.toString(),
              costPerClick: input.metrics.costPerClick.toString(),
              videoRetentionRate: input.metrics.videoRetentionRate.toString(),
              costPerProfileVisit: input.metrics.costPerProfileVisit.toString(),
            });
          }
        }

        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.deleteReportMetrics(input.id);
        await db.deleteReport(input.id);
        return { success: true };
      }),

    publish: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const updated = await db.updateReport(
          input.id,
          report.title,
          report.slug,
          report.startDate,
          report.endDate,
          report.description || undefined,
          "published"
        );

        return updated;
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const report = await db.getReportBySlug(input.slug);
        if (!report || report.isPublished !== "published") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
        }

        const metrics = await db.getMetricsByReportId(report.id);
        const company = await db.getCompanyById(report.companyId);

        return { report, metrics, company };
      }),
  }),

  // ── Meta Marketing API ────────────────────────────────────────────────────
  meta: router({
    /** Retorna o status de conexão Meta de uma empresa */
    getStatus: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        const connected = !!company.metaAccessToken;
        const expired = company.metaTokenExpiresAt
          ? new Date(company.metaTokenExpiresAt) < new Date()
          : false;
        return {
          connected,
          expired,
          hasAdAccount: !!company.metaAdAccountId,
          adAccountId: company.metaAdAccountId ?? null,
          expiresAt: company.metaTokenExpiresAt ?? null,
        };
      }),

    /** Lista as contas de anúncios disponíveis para o token salvo */
    listAdAccounts: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        if (!company.metaAccessToken) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Empresa não conectada ao Meta." });
        }
        const url = new URL("https://graph.facebook.com/v19.0/me/adaccounts");
        url.searchParams.set("fields", "id,name,currency");
        url.searchParams.set("access_token", company.metaAccessToken);
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Meta API: ${data.error.message}` });
        }
        return (data.data ?? []) as Array<{ id: string; name: string; currency: string }>;
      }),

    /** Seleciona qual conta de anúncios usar para a empresa */
    selectAdAccount: protectedProcedure
      .input(z.object({
        companyId: z.number().int().positive(),
        adAccountId: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return db.updateCompanyMeta(input.companyId, input.adAccountId, company.metaAccessToken ?? null);
      }),

    /** Desconecta a empresa do Meta */
    disconnect: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return db.disconnectCompanyMeta(input.companyId);
      }),

    /** Salva/atualiza as credenciais Meta de uma empresa (modo manual, legado) */
    saveCredentials: protectedProcedure
      .input(
        z.object({
          companyId: z.number().int().positive(),
          metaAdAccountId: z.string().min(1, "ID da conta é obrigatório"),
          metaAccessToken: z.string().min(1, "Access Token é obrigatório"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        const updated = await db.updateCompanyMeta(
          input.companyId,
          input.metaAdAccountId.trim(),
          input.metaAccessToken.trim()
        );
        return updated;
      }),

    /** Busca métricas diretamente da Meta API para um período */
    fetchInsights: protectedProcedure
      .input(
        z.object({
          companyId: z.number().int().positive(),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        if (!company.metaAccessToken) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Esta empresa não está conectada ao Meta Ads. Vá em Contas de Anúncio e clique em Conectar com Meta.",
          });
        }
        if (!company.metaAdAccountId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Nenhuma conta de anúncio selecionada. Vá em Contas de Anúncio, abra o painel desta empresa e selecione a conta de anúncio.",
          });
        }
        return fetchMetaInsights(
          company.metaAdAccountId,
          company.metaAccessToken,
          input.startDate,
          input.endDate
        );
      }),

    /** Lista campanhas reais da Meta API para uma empresa */
    listCampaigns: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company || company.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        if (!company.metaAccessToken) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Empresa não conectada ao Meta." });
        }
        if (!company.metaAdAccountId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conta de anúncio não selecionada." });
        }
        const accountId = company.metaAdAccountId.startsWith("act_")
          ? company.metaAdAccountId
          : `act_${company.metaAdAccountId}`;
        const url = new URL(`https://graph.facebook.com/v19.0/${accountId}/campaigns`);
        url.searchParams.set("fields", "id,name,status,objective,created_time,daily_budget,lifetime_budget,effective_status");
        url.searchParams.set("limit", "50");
        url.searchParams.set("access_token", company.metaAccessToken);
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Meta API: ${data.error.message}` });
        }
        return {
          companyId: company.id,
          companyName: company.name,
          adAccountId: company.metaAdAccountId,
          campaigns: (data.data ?? []) as Array<{
            id: string;
            name: string;
            status: string;
            effective_status: string;
            objective: string;
            created_time: string;
            daily_budget?: string;
            lifetime_budget?: string;
          }>,
        };
      }),

    /** Retorna insights agregados de todas as contas conectadas */
    getAllAccountsInsights: protectedProcedure
      .input(z.object({
        days: z.number().int().min(1).max(90).default(30),
        companyId: z.number().int().positive().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const companies = await db.getCompaniesByUserId(ctx.user.id);
        const filtered = companies.filter((c: any) =>
          c.metaAccessToken && c.metaAdAccountId &&
          (!input.companyId || c.id === input.companyId)
        );

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        const fmt = (d: Date) => d.toISOString().split("T")[0];

        const results = await Promise.allSettled(
          filtered.map(async (company: any) => {
            const metrics = await fetchMetaInsights(
              company.metaAdAccountId,
              company.metaAccessToken,
              fmt(startDate),
              fmt(endDate)
            );
            return { companyId: company.id, companyName: company.name, adAccountId: company.metaAdAccountId, metrics };
          })
        );

        const accounts = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
          .map(r => r.value);

        const failed = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map((r, i) => ({ companyName: filtered[i]?.name ?? "?", error: r.reason?.message ?? "Erro" }));

        const totals = accounts.reduce((acc, a) => ({
          totalSpent: acc.totalSpent + (a.metrics.totalSpent ?? 0),
          totalImpressions: acc.totalImpressions + (a.metrics.totalImpressions ?? 0),
          totalReach: acc.totalReach + (a.metrics.totalReach ?? 0),
          totalClicks: acc.totalClicks + (a.metrics.totalClicks ?? 0),
        }), { totalSpent: 0, totalImpressions: 0, totalReach: 0, totalClicks: 0 });

        return { accounts, totals, failed, days: input.days };
      }),
  }),
});

export type AppRouter = typeof appRouter;

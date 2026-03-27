import { COOKIE_NAME } from "../_shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { calculateCPM, calculateCTR } from "../_shared/metrics";
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
}).transform((data) => ({
  ...data,
  totalSpent: data.totalSpent.toString(),
  costPerClick: data.costPerClick.toString(),
  videoRetentionRate: data.videoRetentionRate.toString(),
  costPerProfileVisit: data.costPerProfileVisit.toString(),
  cpm: data.cpm.toString(),
  ctr: data.ctr.toString(),
}));

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
});

export type AppRouter = typeof appRouter;

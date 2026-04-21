import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getRawPool } from "./db";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { nanoid } from "nanoid";

// ─── Database query helper ──────────────────────────────────────────────────
async function executeQuery(sql: string, params: any[] = []) {
  const pool = await getRawPool();
  if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return pool.query(sql, params);
}

// ─── Token helper functions ─────────────────────────────────────────────────
function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Validações ────────────────────────────────────────────────────────────

const createCredentialSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(1, "Nome é obrigatório"),
  platform: z.string().min(1, "Plataforma é obrigatória"),
});

const updateCredentialStatusSchema = z.object({
  credentialId: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

// ─── Router ────────────────────────────────────────────────────────────────

export const apiCredentialsRouter = router({
  /**
   * Criar nova credencial de API
   * Retorna o token UMA VEZ (nunca mais será recuperável)
   */
  create: protectedProcedure
    .input(createCredentialSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Validar permissão à empresa
      const company = await db.getCompanyById(input.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado à empresa" });
      }

      // Gerar token
      const token = generateToken();
      const tokenHash = hashToken(token);

      // Inserir no banco
      const result = await executeQuery(
        `INSERT INTO "apiCredentials" (
          "companyId", "userId", "name", "tokenHash", "platform", "status"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, "companyId", "userId", "name", "platform", "status", "createdAt"`,
        [input.companyId, userId, input.name, tokenHash, input.platform, "active"]
      );

      const credential = result.rows[0];

      return {
        credential,
        token, // Retorna o token apenas uma vez
      };
    }),

  /**
   * Listar todas as credenciais de uma empresa
   * (sem mostrar os tokens, apenas informações básicas)
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
        `SELECT id, "companyId", "userId", "name", "platform", "status", "lastUsedAt", "createdAt", "updatedAt"
         FROM "apiCredentials"
         WHERE "companyId" = $1
         ORDER BY "createdAt" DESC`,
        [input.companyId]
      );

      return result.rows;
    }),

  /**
   * Atualizar status de uma credencial (ativa/inativa)
   */
  updateStatus: protectedProcedure
    .input(updateCredentialStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão
      const credResult = await executeQuery(
        `SELECT * FROM "apiCredentials" WHERE "id" = $1`,
        [input.credentialId]
      );

      if (credResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credencial não encontrada" });
      }

      const cred = credResult.rows[0];

      // Verificar se pertence a uma empresa do usuário
      const company = await db.getCompanyById(cred.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Atualizar status
      const result = await executeQuery(
        `UPDATE "apiCredentials"
         SET "status" = $1, "updatedAt" = NOW()
         WHERE "id" = $2
         RETURNING id, "companyId", "userId", "name", "platform", "status", "lastUsedAt", "createdAt", "updatedAt"`,
        [input.status, input.credentialId]
      );

      return result.rows[0];
    }),

  /**
   * Deletar uma credencial
   */
  delete: protectedProcedure
    .input(z.object({ credentialId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verificar permissão
      const credResult = await executeQuery(
        `SELECT * FROM "apiCredentials" WHERE "id" = $1`,
        [input.credentialId]
      );

      if (credResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credencial não encontrada" });
      }

      const cred = credResult.rows[0];

      // Verificar se pertence a uma empresa do usuário
      const company = await db.getCompanyById(cred.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Deletar credencial
      await executeQuery(
        `DELETE FROM "apiCredentials" WHERE "id" = $1`,
        [input.credentialId]
      );

      return { success: true };
    }),

  /**
   * Obter detalhes de uma credencial (sem o token)
   */
  get: protectedProcedure
    .input(z.object({ credentialId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const credResult = await executeQuery(
        `SELECT id, "companyId", "userId", "name", "platform", "status", "lastUsedAt", "createdAt", "updatedAt"
         FROM "apiCredentials" WHERE "id" = $1`,
        [input.credentialId]
      );

      if (credResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credencial não encontrada" });
      }

      const cred = credResult.rows[0];

      // Verificar se pertence a uma empresa do usuário
      const company = await db.getCompanyById(cred.companyId);
      if (!company || company.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      return cred;
    }),
});

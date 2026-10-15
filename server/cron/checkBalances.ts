import express from "express";
import * as db from "../db";
import { ENV } from "../_core/env";
import { checkBalanceCandidate } from "./balanceService";

const router = express.Router();

/** Endpoint invocado pelo Vercel Cron diariamente. */
router.get("/api/cron/check-balances", async (req, res) => {
  if (!ENV.cronSecret) {
    return res.status(503).json({ error: "CRON_SECRET não configurado" });
  }
  if (req.headers.authorization !== `Bearer ${ENV.cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const alerts = await db.getAllEnabledBalanceAlerts();
    const results = await Promise.all(alerts.map(async (alert) => {
      try {
        return await checkBalanceCandidate(alert);
      } catch (error: any) {
        console.error(`[Cron] falha ao verificar saldo da empresa ${alert.companyId}:`, error?.message || error);
        return {
          companyId: alert.companyId,
          status: "error",
          balanceCents: null,
          message: "Falha interna ao consultar ou salvar o resultado.",
          notified: false,
        };
      }
    }));

    const notified = results.filter((result) => result.notified).length;
    const errors = results.filter((result) => result.status === "error").length;
    console.log(`[Cron] check-balances: ${results.length} contas verificadas, ${notified} notificações, ${errors} erros`);
    return res.json({
      ok: errors === 0,
      checked: results.length,
      notified,
      errors,
      results: results.map(({ companyId, status, message }) => ({ companyId, status, message })),
    });
  } catch (error: any) {
    console.error("[Cron] check-balances falhou:", error?.message || error);
    return res.status(500).json({ error: "Falha ao executar a verificação de saldos." });
  }
});

export default router;

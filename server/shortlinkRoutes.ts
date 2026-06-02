import { Router, Request, Response } from "express";
import { getRawPool } from "./db";
import { nanoid } from "nanoid";

const router = Router();

/**
 * GET /r/:code
 * Link curto de rastreamento UTM. Conta o clique, registra a sessão e
 * redireciona (302) para a URL completa com os parâmetros UTM, para que o
 * destino (loja/landing/pixel) receba os UTMs normalmente.
 */
router.get("/r/:code", async (req: Request, res: Response) => {
  const code = req.params.code;
  try {
    const pool = await getRawPool();
    if (!pool) return res.status(500).send("Database connection failed");

    const result = await pool.query(
      `SELECT * FROM "utmTracking" WHERE "shortCode" = $1 OR "id"::text = $1 LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Link de rastreamento não encontrado.");
    }

    const tracking = result.rows[0];

    // Registra clique + sessão (best-effort; nunca bloqueia o redirect)
    try {
      await pool.query(
        `INSERT INTO "utmSessions" ("trackingId", "sessionId", "ipAddress", "userAgent", "referrer")
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tracking.id,
          nanoid(),
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null,
          (req.headers["user-agent"] as string) || null,
          (req.headers["referer"] as string) || null,
        ]
      );
      await pool.query(
        `UPDATE "utmTracking" SET "clickCount" = "clickCount" + 1 WHERE "id" = $1`,
        [tracking.id]
      );
    } catch (e: any) {
      console.error("[Shortlink] falha ao registrar clique:", e?.message || e);
    }

    // Redireciona para a URL com UTMs (fallback para baseUrl)
    const dest = tracking.trackingUrl || tracking.baseUrl;
    return res.redirect(302, dest);
  } catch (err: any) {
    console.error("[Shortlink] erro:", err?.message || err);
    return res.status(500).send("Erro ao processar link.");
  }
});

export default router;

import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import webhookRoutes from "./webhookRoutes";
import shortlinkRoutes from "./shortlinkRoutes";

const app = express();

// Mantém o corpo bruto (rawBody) para validação de assinatura HMAC de webhooks
app.use(express.json({
  limit: "50mb",
  verify: (req: any, _res, buf) => { req.rawBody = buf?.toString("utf8"); },
}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback
registerOAuthRoutes(app);

// Webhooks de venda (Shopify, WooCommerce, Hotmart, Kiwify, genérico, teste)
// Recebe em /webhook/* — precisa do rewrite correspondente em vercel.json
app.use(webhookRoutes);

// Links curtos de rastreamento UTM em /r/* (conta cliques e redireciona)
app.use(shortlinkRoutes);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;

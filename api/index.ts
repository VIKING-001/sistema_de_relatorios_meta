import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./server/routers.js";
import { createContext } from "./server/_core/context.js";

const app = express();

// Manual CORS to avoid 'cors' package dependency issues on Vercel
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-trpc-source');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "50mb" }));

// TRPC Endpoint
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check endpoint for testing
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Viking System is Online" });
});

export default app;

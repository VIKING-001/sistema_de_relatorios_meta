import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// TRPC Endpoint
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API ERROR]", err);
  res.status(500).json({
    error: {
      message: err.message || "Internal Server Error",
      code: "INTERNAL_ERROR"
    }
  });
});

export default app;

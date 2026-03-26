import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Dynamically import routers to catch startup errors gracefully
let routerReady = false;
let routerError: Error | null = null;
let appRouter: any;
let createContext: any;

const initRouter = (async () => {
  try {
    const routers = await import("../server/routers");
    const ctx = await import("../server/_core/context");
    appRouter = routers.appRouter;
    createContext = ctx.createContext;
    routerReady = true;
  } catch (err: any) {
    routerError = err;
    console.error("[API] Failed to initialize router:", err);
  }
})();

app.use("/api/trpc", async (req, res, next) => {
  // Wait for router initialization
  await initRouter;

  if (!routerReady || !appRouter) {
    res.status(500).json({
      error: {
        message: routerError?.message || "Server failed to initialize",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
    return;
  }

  return createExpressMiddleware({
    router: appRouter,
    createContext,
  })(req, res, next);
});

// Catch-all error handler — always returns JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API] Unhandled error:", err);
  res.status(500).json({
    error: {
      message: err?.message || "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
  });
});

export default app;

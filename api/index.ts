import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";

// Use dynamic imports to prevent startup crashes from affecting the whole lambda
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Global variables to store the router and context
let appRouter: any;
let createContext: any;
let isInitialized = false;
let initError: any = null;

async function initializeApp() {
  if (isInitialized) return true;
  
  try {
    console.log("[API] Starting server initialization...");
    const routers = await import("../server/routers");
    const ctx = await import("../server/_core/context");
    
    appRouter = routers.appRouter;
    createContext = ctx.createContext;
    isInitialized = true;
    console.log("[API] Router and Context loaded successfully.");
    return true;
  } catch (err: any) {
    initError = err;
    console.error("[API] CRITICAL INITIALIZATION ERROR:", err.message);
    console.error(err.stack);
    return false;
  }
}

app.use("/api/trpc", async (req, res, next) => {
  const ready = await initializeApp();

  if (!ready || !appRouter) {
    return res.status(500).json({
      error: {
        message: "Server failed to initialize",
        detail: initError?.message || "Check Vercel logs for more info",
        code: "INITIALIZATION_FAILED"
      }
    });
  }

  return createExpressMiddleware({
    router: appRouter,
    createContext,
  })(req, res, next);
});

// Fallback error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API] Unhandled server error:", err);
  res.status(500).json({
    error: {
      message: err.message || "Internal server error",
      code: "INTERNAL_ERROR"
    }
  });
});

export default app;

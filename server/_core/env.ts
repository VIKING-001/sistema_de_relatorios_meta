export const ENV = {
  appId: process.env.VITE_APP_ID ?? "viking-reports",
  cookieSecret: process.env.JWT_SECRET || process.env.COOKIE_SECRET || "default-viking-secret-key-123",
  databaseUrl: process.env.DATABASE_URL || "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.FORGE_API_URL || process.env.OAUTH_SERVER_URL || "",
  forgeApiKey: process.env.FORGE_API_KEY || "",
  /** Meta / Facebook Developer App */
  metaAppId: (process.env.META_APP_ID || "").trim(),
  metaAppSecret: (process.env.META_APP_SECRET || "").trim(),
  /** URL base para OAuth callback (onde o Meta devolve o código) */
  appBaseUrl: (process.env.APP_BASE_URL || "https://sistemaderelatoriosmeta.vercel.app").trim(),
  /** URL do frontend para redirecionar após OAuth (pode ser diferente do callback) */
  frontendUrl: (process.env.FRONTEND_URL || process.env.APP_BASE_URL || "https://sistemaderelatoriosmeta.vercel.app").trim(),
};

// Log basic status (DO NOT LOG DATABASE_URL FOR SECURITY)
console.log("[ENV] Environment loaded. Production:", ENV.isProduction);
if (!ENV.databaseUrl) {
  console.error("[ENV] CRITICAL: DATABASE_URL is missing!");
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "viking-reports",
  cookieSecret: process.env.JWT_SECRET || process.env.COOKIE_SECRET || "default-viking-secret-key-123",
  databaseUrl: process.env.DATABASE_URL || "",
  isProduction: process.env.NODE_ENV === "production",
};

// Log basic status (DO NOT LOG DATABASE_URL FOR SECURITY)
console.log("[ENV] Environment loaded. Production:", ENV.isProduction);
if (!ENV.databaseUrl) {
  console.error("[ENV] CRITICAL: DATABASE_URL is missing!");
}

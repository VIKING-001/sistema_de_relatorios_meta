import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { ForbiddenError } from "../../shared/_core/errors";
import type { User } from "../../drizzle/schema";

// Use global crypto (available in Node 18+ and edge runtimes)
const getCrypto = () => {
    if (typeof crypto !== 'undefined') return crypto;
    // Fallback for older environments
    return (globalThis as any).crypto;
};

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret || "viking-secret-key-default-366");
}

export async function signSessionJwt(openId: string, name: string): Promise<string> {
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({ openId, name, appId: "viking-reports" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecretKey());
}

export async function verifySessionJwt(
  token: string | undefined | null
): Promise<{ openId: string; name: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const { openId, name } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || !openId) return null;
    return { openId, name: typeof name === "string" ? name : "" };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Password hashing (using Web Crypto API – no native bcrypt needed on Vercel)
// ---------------------------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  const c = getCrypto();
  const encoder = new TextEncoder();
  const salt = nanoid(16);
  const keyMaterial = await c.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await c.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 100000 },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2:${salt}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const [, salt, expectedHash] = parts;
  const c = getCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await c.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await c.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 100000 },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex === expectedHash;
}

// ---------------------------------------------------------------------------
// Auth operations
// ---------------------------------------------------------------------------

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const existing = await db.getUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(password);
  const openId = `local_${nanoid(16)}`;

  await db.upsertUser({
    openId,
    email,
    name,
    passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByEmail(email);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const user = await db.getUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
  return user;
}

// ---------------------------------------------------------------------------
// Request authentication (reads cookie → verifies JWT → loads user from DB)
// ---------------------------------------------------------------------------

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  return new Map(Object.entries(parseCookieHeader(cookieHeader)));
}

export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySessionJwt(sessionCookie);

  if (!session) {
    throw ForbiddenError("Invalid session cookie");
  }

  const user = await db.getUserByOpenId(session.openId);
  if (!user) {
    throw ForbiddenError("User not found");
  }

  return user;
}

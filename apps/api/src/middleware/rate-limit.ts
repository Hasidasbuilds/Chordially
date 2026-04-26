import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

function makeRateLimiter(opts: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs: opts.windowMs ?? 15 * 60 * 1000,
    max: opts.max ?? 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: opts.message ?? "Too many requests, please try again later." },
    skip: (req) => req.ip === "127.0.0.1" && process.env.NODE_ENV === "test",
  });
}

/** Strict limiter for login / register — 10 attempts per 15 min per IP */
export const authRateLimiter: RequestHandler = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many auth attempts. Please wait before trying again.",
});

/** Moderate limiter for state-mutating routes (tips, profile updates) */
export const mutationRateLimiter: RequestHandler = makeRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many requests. Slow down.",
});

/** Loose limiter for general API surface */
export const globalRateLimiter: RequestHandler = makeRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
});

import type { Request, Response, NextFunction, RequestHandler } from "express";

const BLOCKED_UA_PATTERNS = [/sqlmap/i, /nikto/i, /masscan/i, /zgrab/i];
const SUSPICIOUS_PAYLOAD_KEYS = ["$where", "__proto__", "constructor", "eval("];

function hasSuspiciousPayload(obj: unknown, depth = 0): boolean {
  if (depth > 5 || typeof obj !== "object" || obj === null) return false;
  return Object.keys(obj as Record<string, unknown>).some(
    (k) =>
      SUSPICIOUS_PAYLOAD_KEYS.some((p) => k.includes(p)) ||
      hasSuspiciousPayload((obj as Record<string, unknown>)[k], depth + 1)
  );
}

function isBlockedUserAgent(ua: string | undefined): boolean {
  if (!ua) return false;
  return BLOCKED_UA_PATTERNS.some((p) => p.test(ua));
}

function logAbuse(req: Request, reason: string): void {
  console.warn("[anti-abuse]", {
    reason,
    ip: req.ip,
    method: req.method,
    path: req.path,
    ua: req.headers["user-agent"],
    ts: new Date().toISOString(),
  });
}

export const antiAbuseMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isBlockedUserAgent(req.headers["user-agent"])) {
    logAbuse(req, "blocked-user-agent");
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (hasSuspiciousPayload(req.body)) {
    logAbuse(req, "suspicious-payload");
    res.status(400).json({ error: "Invalid request payload" });
    return;
  }

  const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);
  if (contentLength > 1_000_000) {
    logAbuse(req, "oversized-payload");
    res.status(413).json({ error: "Payload too large" });
    return;
  }

  next();
};

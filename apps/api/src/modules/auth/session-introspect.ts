import type { FastifyInstance } from "fastify";
import { verifyToken } from "./auth.tokens.js";
import { authStore } from "./auth.store.js";

interface SessionClaims {
  sub: string;
  role: string;
  capabilities: string[];
  issuedAt: number;
  expiresAt: number;
}

async function resolveSession(token: string): Promise<SessionClaims | null> {
  const userId = verifyToken(token);
  if (!userId) return null;

  const user = await authStore.findById(userId);
  if (!user) return null;

  return {
    sub: userId,
    role: user.role,
    capabilities: capabilitiesForRole(user.role),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
  };
}

function capabilitiesForRole(role: string): string[] {
  const map: Record<string, string[]> = {
    fan: ["tip", "follow", "comment"],
    artist: ["tip", "follow", "comment", "stream", "withdraw"],
    admin: ["tip", "follow", "comment", "stream", "withdraw", "moderate"],
  };
  return map[role] ?? [];
}

export async function sessionIntrospectRoutes(app: FastifyInstance) {
  app.get("/auth/session", async (request, reply) => {
    const authHeader = request.headers.authorization ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return reply.status(401).send({ error: "missing_token" });
    }

    const claims = await resolveSession(token);
    if (!claims) {
      return reply.status(401).send({ error: "invalid_or_expired_token" });
    }

    return reply.send(claims);
  });
}

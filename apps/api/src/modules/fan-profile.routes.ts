import type { FastifyInstance } from "fastify";

interface FanProfile {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  isPublic: boolean;
  updatedAt: string;
}

// In-memory store — replace with DB layer
const profiles = new Map<string, FanProfile>();

function validateDisplayName(name: string): string | null {
  if (!name || name.trim().length < 2) return "display_name_too_short";
  if (name.length > 50) return "display_name_too_long";
  return null;
}

export async function fanProfileRoutes(app: FastifyInstance) {
  app.post<{ Body: Omit<FanProfile, "updatedAt"> }>(
    "/profiles/fan",
    async (request, reply) => {
      const { userId, displayName, bio, avatarUrl, notificationsEnabled, isPublic } =
        request.body;

      const err = validateDisplayName(displayName);
      if (err) return reply.status(400).send({ error: err });

      if (profiles.has(userId)) {
        return reply.status(409).send({ error: "profile_already_exists" });
      }

      const profile: FanProfile = {
        userId,
        displayName: displayName.trim(),
        bio: bio ?? "",
        avatarUrl: avatarUrl ?? null,
        notificationsEnabled: notificationsEnabled ?? true,
        isPublic: isPublic ?? true,
        updatedAt: new Date().toISOString(),
      };

      profiles.set(userId, profile);
      return reply.status(201).send(profile);
    }
  );

  app.patch<{ Params: { userId: string }; Body: Partial<FanProfile> }>(
    "/profiles/fan/:userId",
    async (request, reply) => {
      const existing = profiles.get(request.params.userId);
      if (!existing) return reply.status(404).send({ error: "profile_not_found" });

      if (request.body.displayName) {
        const err = validateDisplayName(request.body.displayName);
        if (err) return reply.status(400).send({ error: err });
      }

      const updated: FanProfile = {
        ...existing,
        ...request.body,
        userId: existing.userId,
        updatedAt: new Date().toISOString(),
      };

      profiles.set(existing.userId, updated);
      return reply.send(updated);
    }
  );
}

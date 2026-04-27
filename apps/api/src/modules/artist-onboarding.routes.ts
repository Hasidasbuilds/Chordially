import type { FastifyInstance } from "fastify";

type OnboardingStep = "identity" | "genre" | "location" | "payout";
type DraftStatus = "incomplete" | "ready";

interface ArtistDraft {
  artistId: string;
  stageName: string | null;
  genre: string | null;
  location: string | null;
  payoutReady: boolean;
  completedSteps: OnboardingStep[];
  status: DraftStatus;
  updatedAt: string;
}

const drafts = new Map<string, ArtistDraft>();

function computeStatus(draft: ArtistDraft): DraftStatus {
  const required: OnboardingStep[] = ["identity", "genre", "location", "payout"];
  return required.every((s) => draft.completedSteps.includes(s))
    ? "ready"
    : "incomplete";
}

export async function artistOnboardingRoutes(app: FastifyInstance) {
  app.put<{ Params: { artistId: string }; Body: Partial<ArtistDraft> }>(
    "/onboarding/artist/:artistId/draft",
    async (request, reply) => {
      const { artistId } = request.params;
      const existing = drafts.get(artistId) ?? {
        artistId,
        stageName: null,
        genre: null,
        location: null,
        payoutReady: false,
        completedSteps: [] as OnboardingStep[],
        status: "incomplete" as DraftStatus,
        updatedAt: new Date().toISOString(),
      };

      const merged: ArtistDraft = {
        ...existing,
        ...request.body,
        artistId,
        updatedAt: new Date().toISOString(),
      };

      if (merged.stageName && !merged.completedSteps.includes("identity")) {
        merged.completedSteps.push("identity");
      }
      if (merged.genre && !merged.completedSteps.includes("genre")) {
        merged.completedSteps.push("genre");
      }
      if (merged.location && !merged.completedSteps.includes("location")) {
        merged.completedSteps.push("location");
      }
      if (merged.payoutReady && !merged.completedSteps.includes("payout")) {
        merged.completedSteps.push("payout");
      }

      merged.status = computeStatus(merged);
      drafts.set(artistId, merged);
      return reply.send(merged);
    }
  );

  app.get<{ Params: { artistId: string } }>(
    "/onboarding/artist/:artistId/draft",
    async (request, reply) => {
      const draft = drafts.get(request.params.artistId);
      if (!draft) return reply.status(404).send({ error: "draft_not_found" });
      return reply.send(draft);
    }
  );
}

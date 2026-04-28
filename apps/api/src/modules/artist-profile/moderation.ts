// CHORD-058: Profile moderation fields and controls

export type ModerationState = "active" | "hidden" | "shadow_restricted" | "under_review";

export interface ModerationRecord {
  profileId: string;
  state: ModerationState;
  reason: string | null;
  reviewedBy: string | null;
  updatedAt: string;
}

const store = new Map<string, ModerationRecord>();

export function initModeration(profileId: string): ModerationRecord {
  const record: ModerationRecord = {
    profileId,
    state: "active",
    reason: null,
    reviewedBy: null,
    updatedAt: new Date().toISOString(),
  };
  store.set(profileId, record);
  return record;
}

export function setModerationState(
  profileId: string,
  state: ModerationState,
  reviewedBy: string,
  reason?: string
): ModerationRecord {
  const existing = store.get(profileId) ?? initModeration(profileId);
  const updated: ModerationRecord = {
    ...existing,
    state,
    reason: reason ?? null,
    reviewedBy,
    updatedAt: new Date().toISOString(),
  };
  store.set(profileId, updated);
  auditModeration(profileId, state, reviewedBy);
  return updated;
}

export function getModerationRecord(profileId: string): ModerationRecord | null {
  return store.get(profileId) ?? null;
}

export function isProfileVisible(profileId: string): boolean {
  const record = store.get(profileId);
  return !record || record.state === "active";
}

const auditLog: Array<{ profileId: string; state: string; by: string; ts: string }> = [];

function auditModeration(profileId: string, state: string, by: string): void {
  auditLog.push({ profileId, state, by, ts: new Date().toISOString() });
}

export function getModerationAuditLog(profileId: string) {
  return auditLog.filter((e) => e.profileId === profileId);
}

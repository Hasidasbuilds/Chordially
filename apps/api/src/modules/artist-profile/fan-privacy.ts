// CHORD-059: Fan privacy controls for leaderboard display names

export type DisplayNameMode = "real" | "pseudonym" | "anonymous";

export interface FanPrivacySettings {
  fanId: string;
  globalMode: DisplayNameMode;
  pseudonym: string | null;
  sessionOverrides: Record<string, DisplayNameMode>;
  updatedAt: string;
}

const store = new Map<string, FanPrivacySettings>();

export function initFanPrivacy(fanId: string): FanPrivacySettings {
  const settings: FanPrivacySettings = {
    fanId,
    globalMode: "real",
    pseudonym: null,
    sessionOverrides: {},
    updatedAt: new Date().toISOString(),
  };
  store.set(fanId, settings);
  return settings;
}

export function setGlobalDisplayMode(
  fanId: string,
  mode: DisplayNameMode,
  pseudonym?: string
): FanPrivacySettings {
  const existing = store.get(fanId) ?? initFanPrivacy(fanId);
  if (mode === "pseudonym" && !pseudonym) throw new Error("pseudonym required when mode is pseudonym");
  const updated: FanPrivacySettings = {
    ...existing,
    globalMode: mode,
    pseudonym: pseudonym ?? existing.pseudonym,
    updatedAt: new Date().toISOString(),
  };
  store.set(fanId, updated);
  return updated;
}

export function setSessionOverride(fanId: string, sessionId: string, mode: DisplayNameMode): void {
  const settings = store.get(fanId) ?? initFanPrivacy(fanId);
  settings.sessionOverrides[sessionId] = mode;
  settings.updatedAt = new Date().toISOString();
  store.set(fanId, settings);
}

export function resolveDisplayName(fanId: string, realName: string, sessionId?: string): string {
  const settings = store.get(fanId);
  if (!settings) return realName;
  const mode = sessionId ? (settings.sessionOverrides[sessionId] ?? settings.globalMode) : settings.globalMode;
  if (mode === "anonymous") return "Anonymous";
  if (mode === "pseudonym") return settings.pseudonym ?? realName;
  return realName;
}

export function getFanPrivacy(fanId: string): FanPrivacySettings | null {
  return store.get(fanId) ?? null;
}

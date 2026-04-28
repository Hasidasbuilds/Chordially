"use client";

import { useCallback } from "react";

type EventMap = {
  discovery_impression: { artistId: string; source: string };
  session_join: { sessionId: string; artistId: string };
  tip_attempt: { sessionId: string; amountUsd: number; currency: "USDC" | "XLM" };
  tip_success: { sessionId: string; txHash: string };
  onboarding_step: { step: string; role: "artist" | "fan" };
};

type EventName = keyof EventMap;

function dispatch<E extends EventName>(name: E, payload: EventMap[E]) {
  if (typeof window === "undefined") return;

  // Swap the console.log for your real analytics sink (Segment, PostHog, etc.)
  console.log("[analytics]", name, payload);

  // Example: window.analytics?.track(name, payload);
}

export function useAnalytics() {
  const track = useCallback(<E extends EventName>(name: E, payload: EventMap[E]) => {
    dispatch(name, payload);
  }, []);

  return { track };
}

// Convenience typed helpers
export const analytics = {
  discoveryImpression: (p: EventMap["discovery_impression"]) =>
    dispatch("discovery_impression", p),
  sessionJoin: (p: EventMap["session_join"]) => dispatch("session_join", p),
  tipAttempt: (p: EventMap["tip_attempt"]) => dispatch("tip_attempt", p),
  tipSuccess: (p: EventMap["tip_success"]) => dispatch("tip_success", p),
  onboardingStep: (p: EventMap["onboarding_step"]) => dispatch("onboarding_step", p),
};

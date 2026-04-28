"use client";

import { createContext, useContext, ReactNode, useCallback, useRef } from "react";

type EventMap = {
  discovery_impression: { artistId: string; source: string };
  session_join: { sessionId: string; artistId: string };
  tip_attempt: { sessionId: string; amountUsd: number; currency: "USDC" | "XLM" };
  tip_success: { sessionId: string; txHash: string };
  onboarding_step: { step: string; role: "artist" | "fan" };
};

type EventName = keyof EventMap;

interface AnalyticsContextValue {
  track<E extends EventName>(name: E, payload: EventMap[E]): void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const queue = useRef<Array<{ name: string; payload: unknown; ts: number }>>([]);

  const flush = useCallback(() => {
    if (queue.current.length === 0) return;
    console.log("[analytics:batch]", queue.current);
    // Replace with real sink: fetch("/api/analytics", { method: "POST", body: JSON.stringify(queue.current) })
    queue.current = [];
  }, []);

  const track = useCallback(
    <E extends EventName>(name: E, payload: EventMap[E]) => {
      queue.current.push({ name, payload, ts: Date.now() });
      if (queue.current.length >= 5) flush();
    },
    [flush]
  );

  // Flush on unmount or visibility change
  useCallback(() => {
    const onHide = () => flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
      flush();
    };
  }, [flush]);

  return <AnalyticsContext.Provider value={{ track }}>{children}</AnalyticsContext.Provider>;
}

export function useAnalyticsContext() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalyticsContext must be used within AnalyticsProvider");
  return ctx;
}

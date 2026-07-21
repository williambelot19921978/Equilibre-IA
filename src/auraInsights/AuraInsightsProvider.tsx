import { useEffect, useRef, type ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";
import { isAuraInsightsEnabled } from "./adminAccess";
import { initErrorMonitor } from "./errorMonitor";
import { trackInsightEvent } from "./eventStore";
import { endPerfMark, startPerfMark } from "./performanceMonitor";

type AuraInsightsProviderProps = {
  children: ReactNode;
};

export function AuraInsightsProvider({ children }: AuraInsightsProviderProps) {
  const { user } = useAuth();
  const sessionStart = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuraInsightsEnabled()) return;
    initErrorMonitor(() => user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuraInsightsEnabled() || !user?.id) return;

    sessionStart.current = Date.now();
    startPerfMark("app_open");
    trackInsightEvent(user.id, "app_opened", { feature: "app" });
    trackInsightEvent(user.id, "session_started", {});
    endPerfMark(user.id, "app_open");

    return () => {
      const durationMs = sessionStart.current
        ? Math.round(Date.now() - sessionStart.current)
        : 0;
      trackInsightEvent(user.id, "session_ended", { durationMs });
    };
  }, [user?.id]);

  return children;
}

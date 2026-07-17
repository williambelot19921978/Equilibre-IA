export const PLAN_REFRESH_EVENT = "equilibre:plan-refresh";

export type PlanRefreshDetail = {
  dates: string[];
};

export function dispatchPlanRefresh(dates: string[]): void {
  if (typeof window === "undefined" || dates.length === 0) return;

  window.dispatchEvent(
    new CustomEvent<PlanRefreshDetail>(PLAN_REFRESH_EVENT, {
      detail: { dates: [...new Set(dates)] },
    }),
  );
}

export function subscribePlanRefresh(
  listener: (dates: string[]) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleEvent(event: Event) {
    const custom = event as CustomEvent<PlanRefreshDetail>;
    listener(custom.detail?.dates ?? []);
  }

  window.addEventListener(PLAN_REFRESH_EVENT, handleEvent);
  return () => window.removeEventListener(PLAN_REFRESH_EVENT, handleEvent);
}

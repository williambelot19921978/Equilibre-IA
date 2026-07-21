/**
 * EPIC 7A — Demo mode (sample data overlay, user-controlled).
 */

const DEMO_KEY = "equilibre-demo-mode";

export function isDemoModeActive(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DEMO_KEY) === "true";
}

export function enableDemoMode(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEMO_KEY, "true");
}

export function disableDemoMode(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(DEMO_KEY);
}

export type DemoSnapshot = {
  greeting: string;
  dailyStateLabel: string;
  dailyStateDetail: string;
  priorityLabel: string;
  coachTip: string;
  nextAction: string;
  planningSummary: string;
  checkinHistoryDays: number;
};

export function buildDemoSnapshot(): DemoSnapshot {
  return {
    greeting: "Bonjour",
    dailyStateLabel: "Énergie stable",
    dailyStateDetail: "Humeur positive — bonne base pour avancer sereinement.",
    priorityLabel: "Équilibre famille / travail",
    coachTip:
      "Profite d'une matinée calme pour avancer sur ton objectif sport de la semaine.",
    nextAction: "09:30 — Course matinale (30 min)",
    planningSummary: "4 blocs planifiés · 1 créneau libre cet après-midi",
    checkinHistoryDays: 7,
  };
}

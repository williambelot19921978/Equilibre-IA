export type WeeklyReview = {
  weekLabel: string;
  startDate: string;
  endDate: string;
  goalsReached: string[];
  goalsMissed: string[];
  fatigueSummary: string;
  progressSummary: string;
  balanceSummary: string;
  successes: string[];
  advice: string[];
  priority: string;
  tone: "encouraging";
};

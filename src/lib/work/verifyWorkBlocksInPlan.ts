import type { DayPlan } from "../../types/planning";

export function verifyWorkBlocksInPlan(plan: DayPlan): {
  hasWork: boolean;
  hasCommuteOut: boolean;
  hasCommuteIn: boolean;
  complete: boolean;
} {
  const types = plan.constraints.map((constraint) => constraint.type);
  const hasWork = types.includes("work");
  const hasCommuteOut = types.includes("commute_out");
  const hasCommuteIn = types.includes("commute_in");

  return {
    hasWork,
    hasCommuteOut,
    hasCommuteIn,
    complete: hasWork && hasCommuteOut && hasCommuteIn,
  };
}

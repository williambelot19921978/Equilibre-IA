import { GoalNextActionCard } from "./GoalNextActionCard";
import type { GoalNextAction } from "../../types/goal";

type GoalProgressAssistantProps = {
  nextAction: GoalNextAction | null;
  onPlan?: () => void;
};

export function GoalProgressAssistant({
  nextAction,
  onPlan,
}: GoalProgressAssistantProps) {
  if (!nextAction) return null;

  return <GoalNextActionCard nextAction={nextAction} onPlan={onPlan} />;
}

import { Button } from "../ui/Button";
import { WhyRecommendationButton } from "../trust/WhyRecommendationButton";
import type { GoalNextAction } from "../../types/goal";
import type { RecommendationWhyDetails } from "../../trustCenter";

type GoalNextActionCardProps = {
  nextAction: GoalNextAction;
  onPlan?: () => void;
  whyDetails?: RecommendationWhyDetails;
};

function resolveHeadline(status: GoalNextAction["status"]): string {
  if (status === "ready") return "Prochaine meilleure action";
  if (status === "completed") return "Objectif à jour";
  return "Prochaine étape suggérée";
}

function resolveBody(nextAction: GoalNextAction): string {
  if (nextAction.status === "empty") {
    return `Ajoute des étapes à « ${nextAction.goalName} » pour définir ton parcours.`;
  }

  if (nextAction.status === "no_tasks") {
    return `Lie des tâches existantes à « ${nextAction.stepTitle ?? "cette étape"} ».`;
  }

  if (nextAction.status === "completed") {
    return `Toutes les tâches liées à « ${nextAction.goalName} » sont terminées.`;
  }

  return nextAction.taskTitle ?? "Continuer ton objectif";
}

export function GoalNextActionCard({
  nextAction,
  onPlan,
  whyDetails,
}: GoalNextActionCardProps) {
  const showPlanButton =
    nextAction.status === "ready" && Boolean(onPlan);

  return (
    <section className="goal-next-action-card" aria-label="Prochaine meilleure action">
      <p className="card-label">{resolveHeadline(nextAction.status)}</p>

      <h2>{resolveBody(nextAction)}</h2>

      <dl className="goal-next-action-meta">
        {nextAction.status === "ready" && nextAction.estimatedMinutes != null && (
          <div>
            <dt>Temps estimé</dt>
            <dd>{nextAction.estimatedMinutes} minutes</dd>
          </div>
        )}

        {nextAction.stepTitle && (
          <div>
            <dt>Étape</dt>
            <dd>{nextAction.stepTitle}</dd>
          </div>
        )}

        <div>
          <dt>Objectif</dt>
          <dd>{nextAction.goalName}</dd>
        </div>
      </dl>

      {whyDetails && <WhyRecommendationButton details={whyDetails} />}

      {showPlanButton && (
        <Button type="button" variant="secondary" onClick={onPlan}>
          Planifier
        </Button>
      )}
    </section>
  );
}

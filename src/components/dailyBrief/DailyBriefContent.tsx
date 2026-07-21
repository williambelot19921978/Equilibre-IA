import type { DailyBrief } from "../../lib/dailyBrief/buildDailyBrief";
import type { PresentedDailyBriefRecommendation } from "../../lib/explainability/presentDailyBrief";
import { DailyBriefCard } from "./DailyBriefCard";

type DailyBriefContentProps = {
  brief: DailyBrief;
  presentedRecommendations: PresentedDailyBriefRecommendation[];
  onRecommendationAction?: (
    recommendation: PresentedDailyBriefRecommendation,
  ) => void;
};

export function DailyBriefContent({
  brief,
  presentedRecommendations,
  onRecommendationAction,
}: DailyBriefContentProps) {
  return (
    <div className="daily-brief-content">
      <p className="daily-brief-greeting">{brief.greeting}</p>
      <p className="daily-brief-synthesis">{brief.synthesis}</p>

      {brief.goalInsight && (
        <p className="daily-brief-goal-insight">{brief.goalInsight}</p>
      )}

      {presentedRecommendations.length > 0 && (
        <div className="daily-brief-cards">
          {presentedRecommendations.map((recommendation) => (
            <DailyBriefCard
              key={recommendation.id}
              icon={recommendation.icon}
              title={recommendation.title}
              explanation={recommendation.explanation}
              actionLabel={recommendation.actionLabel}
              onAction={
                recommendation.actionLabel && onRecommendationAction
                  ? () => onRecommendationAction(recommendation)
                  : undefined
              }
              showWhyButton={recommendation.showWhyButton}
              whyReasons={[...recommendation.whyReasons]}
              associatedGoalName={recommendation.associatedGoalName}
              associatedStepTitle={recommendation.associatedStepTitle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

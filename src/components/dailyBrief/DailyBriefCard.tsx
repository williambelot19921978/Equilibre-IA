import { useState } from "react";

import { Button } from "../ui/Button";
import { RecommendationWhyPanel } from "../explainability/RecommendationWhyPanel";

type DailyBriefCardProps = {
  icon: string;
  title: string;
  explanation: string;
  actionLabel?: string;
  onAction?: () => void;
  whyReasons?: string[];
  showWhyButton?: boolean;
  associatedGoalName?: string;
  associatedStepTitle?: string;
};

export function DailyBriefCard({
  icon,
  title,
  explanation,
  actionLabel,
  onAction,
  whyReasons = [],
  showWhyButton = false,
  associatedGoalName,
  associatedStepTitle,
}: DailyBriefCardProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const paragraphs = explanation
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const canShowWhy = showWhyButton && whyReasons.length > 0;

  return (
    <article className="daily-brief-card">
      <header className="daily-brief-card-header">
        <span className="daily-brief-card-icon" aria-hidden="true">
          {icon}
        </span>
        <h3>{title}</h3>
      </header>
      <div className="daily-brief-card-copy">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        {associatedGoalName && (
          <div className="daily-brief-goal-association">
            <p>
              <strong>Objectif associé</strong>
              <br />
              {associatedGoalName}
            </p>
            {associatedStepTitle && (
              <p>
                <strong>Étape</strong>
                <br />
                {associatedStepTitle}
              </p>
            )}
          </div>
        )}
      </div>

      {canShowWhy && (
        <div className="daily-brief-card-why">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((value) => !value)}
          >
            {whyOpen ? "Masquer" : "Pourquoi ?"}
          </Button>
          {whyOpen && <RecommendationWhyPanel reasons={whyReasons} />}
        </div>
      )}

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </article>
  );
}

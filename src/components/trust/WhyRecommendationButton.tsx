import { useState } from "react";

import { Button } from "../ui/Button";
import { RecommendationWhyPanel } from "../explainability/RecommendationWhyPanel";
import type { RecommendationWhyDetails } from "../../trustCenter/types";

type WhyRecommendationButtonProps = {
  details: RecommendationWhyDetails;
  className?: string;
};

export function WhyRecommendationButton({ details, className = "" }: WhyRecommendationButtonProps) {
  const [open, setOpen] = useState(false);
  const hasContent =
    details.why.length > 0 || details.dataUsed.length > 0 || details.goalName;

  if (!hasContent) return null;

  return (
    <div className={`why-recommendation${className ? ` ${className}` : ""}`} data-testid="why-recommendation">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Masquer" : "Pourquoi ?"}
      </Button>

      {open && (
        <div className="why-recommendation-panel aura-glass aura-rise-in">
          {details.dataUsed.length > 0 && (
            <section>
              <h4>Données utilisées</h4>
              <ul>
                {details.dataUsed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {details.why.length > 0 && (
            <RecommendationWhyPanel reasons={[...details.why]} />
          )}

          {details.goalName && (
            <p className="why-recommendation-goal">
              <strong>Objectif concerné :</strong> {details.goalName}
            </p>
          )}

          <p className="why-recommendation-confidence">
            <strong>Confiance :</strong> {details.confidenceLabel}
          </p>

          {details.canIgnore && (
            <p className="why-recommendation-ignore">
              Vous pouvez ignorer cette suggestion sans conséquence.
              {details.onIgnore && (
                <>
                  {" "}
                  <Button variant="secondary" size="sm" onClick={details.onIgnore}>
                    Ignorer
                  </Button>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

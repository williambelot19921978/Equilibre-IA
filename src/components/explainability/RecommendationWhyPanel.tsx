type RecommendationWhyPanelProps = {
  reasons: string[];
};

export function RecommendationWhyPanel({ reasons }: RecommendationWhyPanelProps) {
  if (reasons.length === 0) return null;

  return (
    <div className="recommendation-why-panel" aria-live="polite">
      <p className="recommendation-why-panel-title">Pourquoi cette recommandation ?</p>
      <ul className="recommendation-why-list">
        {reasons.map((reason) => (
          <li key={reason}>
            <span aria-hidden="true">✓</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

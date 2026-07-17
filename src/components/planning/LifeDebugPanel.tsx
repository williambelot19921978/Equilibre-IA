import type { LifeContext } from "../../types/lifeContext";
import { LIFE_DAY_TYPE_LABELS } from "../../types/lifeContext";

type LifeDebugPanelProps = {
  lifeContext: LifeContext | null | undefined;
};

export function LifeDebugPanel({ lifeContext }: LifeDebugPanelProps) {
  if (!import.meta.env.DEV || !lifeContext) {
    return null;
  }

  return (
    <section className="life-debug-panel" aria-label="Life Engine debug">
      <h2>Life Engine (dev)</h2>

      <div className="life-debug-grid">
        <div>
          <span>Type de journée</span>
          <strong>{LIFE_DAY_TYPE_LABELS[lifeContext.dayType]}</strong>
          <p>{lifeContext.dayTypeReason}</p>
        </div>

        <div>
          <span>Énergie prévue</span>
          <strong>{lifeContext.energyPrediction}</strong>
        </div>

        <div>
          <span>Temps libre</span>
          <strong>{lifeContext.availableMinutes} min</strong>
        </div>

        <div>
          <span>Temps bloqué</span>
          <strong>{lifeContext.lockedMinutes} min</strong>
        </div>
      </div>

      <details>
        <summary>Raisonnement</summary>
        <ul>
          {lifeContext.reasoning.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <details>
        <summary>Créneaux libres ({lifeContext.freeSlots.length})</summary>
        <ul>
          {lifeContext.freeSlots.map((slot) => (
            <li key={slot.id}>
              {slot.durationMinutes} min — score {slot.score} — {slot.scoreReason}
            </li>
          ))}
        </ul>
      </details>

      <details>
        <summary>Propositions ({lifeContext.proposals.length})</summary>
        <ul>
          {lifeContext.proposals.map((proposal) => (
            <li key={proposal.id}>
              <strong>{proposal.title}</strong> — {proposal.reason}
            </li>
          ))}
        </ul>
      </details>

      <p className="planning-hint">
        workDay={String(lifeContext.workDay)} · vacation=
        {String(lifeContext.vacation)} · travel=
        {String(lifeContext.travelDay)} · sport=
        {String(lifeContext.sportPossible)} · study=
        {String(lifeContext.studyPossible)}
      </p>
    </section>
  );
}

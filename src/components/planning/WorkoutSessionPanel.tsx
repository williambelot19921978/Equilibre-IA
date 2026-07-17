import type { WorkoutSession } from "../../types/workoutSession";
import {
  WORKOUT_LEVEL_LABELS,
  WORKOUT_SESSION_TYPE_LABELS,
} from "../../types/workoutSession";
import { Button } from "../ui/Button";

type WorkoutSessionPanelProps = {
  session: WorkoutSession;
  onClose: () => void;
};

function formatExercise(item: WorkoutSession["warmup"][number]): string {
  const parts = [item.name];
  if (item.repetitions) parts.push(item.repetitions);
  if (item.durationSeconds) parts.push(`${item.durationSeconds} s`);
  return parts.join(" — ");
}

export function WorkoutSessionPanel({ session, onClose }: WorkoutSessionPanelProps) {
  return (
    <div className="workout-session-panel" role="dialog" aria-label="Détail de la séance">
      <header>
        <h3>{session.title}</h3>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      </header>

      <ul className="workout-session-meta">
        <li>{WORKOUT_LEVEL_LABELS[session.level]}</li>
        <li>{session.durationMinutes} min</li>
        <li>{WORKOUT_SESSION_TYPE_LABELS[session.type]}</li>
        <li>{session.equipment}</li>
      </ul>

      <p className="workout-session-reason">{session.generatedReason}</p>

      {(session.safetyNotes?.length ?? 0) > 0 && (
        <ul className="workout-session-safety">
          {session.safetyNotes!.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      {session.safetyNote && !session.safetyNotes?.length && (
        <p className="workout-session-safety">{session.safetyNote}</p>
      )}

      <section>
        <h4>Échauffement</h4>
        <ul>
          {session.warmup.map((item) => (
            <li key={item.name}>
              {formatExercise(item)}
              {item.instructions && (
                <span className="workout-exercise-hint"> — {item.instructions}</span>
              )}
              {item.easierVariation && (
                <span className="workout-exercise-variation">
                  {" "}
                  Variante facile : {item.easierVariation}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {session.blocks.map((block) => (
        <section key={block.label}>
          <h4>
            {block.label}
            {block.rounds ? ` — ${block.rounds} tour${block.rounds > 1 ? "s" : ""}` : ""}
          </h4>
          <ul>
            {block.exercises.map((item) => (
              <li key={`${block.label}-${item.name}`}>
                {formatExercise(item)}
                {item.easierVariation && (
                  <span className="workout-exercise-variation">
                    {" "}
                    Plus facile : {item.easierVariation}
                  </span>
                )}
                {item.harderVariation && (
                  <span className="workout-exercise-variation">
                    {" "}
                    Plus difficile : {item.harderVariation}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {block.restSeconds ? (
            <p>Repos : {block.restSeconds}s entre les tours</p>
          ) : null}
        </section>
      ))}

      <section>
        <h4>Retour au calme</h4>
        <ul>
          {session.cooldown.map((item) => (
            <li key={item.name}>{formatExercise(item)}</li>
          ))}
        </ul>
      </section>

      {session.instructions && (
        <p className="workout-session-instructions">{session.instructions}</p>
      )}
    </div>
  );
}

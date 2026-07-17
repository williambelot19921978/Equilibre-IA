import { formatDeviceTime } from "../../lib/time/deviceClock";
import { computeDayNowState } from "../../lib/planning/dayNowState";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";

type DayNowStatusProps = {
  entries: DayTimelineEntry[];
  now: Date;
  show: boolean;
};

export function DayNowStatus({ entries, now, show }: DayNowStatusProps) {
  if (!show) return null;

  const state = computeDayNowState(entries, now);

  return (
    <section className="day-now-status" aria-live="polite">
      {state.currentEntry ? (
        <p>
          <strong>Maintenant :</strong> {state.currentEntry.title} jusqu’à{" "}
          {formatDeviceTime(state.currentEntry.endsAt)}
        </p>
      ) : (
        <p>
          <strong>Maintenant :</strong> aucune activité en cours
        </p>
      )}

      {state.nextEntry && state.minutesUntilNext !== null ? (
        <p>
          <strong>Prochaine activité</strong> dans {state.minutesUntilNext}{" "}
          minute{state.minutesUntilNext > 1 ? "s" : ""} : {state.nextEntry.title}{" "}
          ({formatDeviceTime(state.nextEntry.startsAt)})
        </p>
      ) : (
        <p>Aucune activité restante aujourd’hui.</p>
      )}
    </section>
  );
}

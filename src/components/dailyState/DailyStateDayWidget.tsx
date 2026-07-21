import { Link } from "react-router-dom";

import {
  defaultDailyStateEngine,
  MOOD_OPTIONS,
  type DailyState,
} from "../../dailyStateEngine";
import { getButtonClassName } from "../ui/buttonClasses";
import { AppRoutes } from "../../lib/navigation/routes";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";

type DailyStateDayWidgetProps = {
  readonly userId: string;
  readonly date: string;
};

function moodLabel(state: DailyState): string {
  return MOOD_OPTIONS.find((option) => option.value === state.mood)?.label ?? state.mood;
}

function moodEmoji(state: DailyState): string {
  return MOOD_OPTIONS.find((option) => option.value === state.mood)?.emoji ?? "🙂";
}

export function DailyStateDayWidget({ userId, date }: DailyStateDayWidgetProps) {
  const isToday = date === getCurrentDeviceDate();
  const snapshot = defaultDailyStateEngine.analyze(userId, date);
  const state = isToday ? snapshot.today : defaultDailyStateEngine.getToday(userId, date);

  return (
    <section className="home-widget home-widget-checkin" data-testid="daily-state-day-widget">
      <div className="daily-checkin-compact">
        <div>
          <p className="card-label">État du jour</p>
          <h2>{isToday ? "Ton ressenti aujourd'hui" : "Ressenti ce jour-là"}</h2>
          {state ? (
            <p className="daily-checkin-current">
              {moodEmoji(state)} {moodLabel(state)} — énergie {state.energy}/10 — stress{" "}
              {state.stress}/10
            </p>
          ) : (
            <p className="daily-checkin-current">Pas encore renseigné.</p>
          )}
        </div>
        {isToday && (
          <Link
            to={AppRoutes.DAILY_CHECK_IN}
            className={getButtonClassName({ variant: "primary", size: "sm" })}
          >
            {state ? "Modifier" : "Check-in"}
          </Link>
        )}
      </div>

      {isToday && snapshot.shouldRemind && snapshot.reminderMessage && (
        <p className="daily-checkin-reminder">{snapshot.reminderMessage}</p>
      )}

      {state && (
        <p className="daily-checkin-meta">
          Sommeil {"⭐".repeat(state.sleepQuality)}
          {state.specialDay !== "normal" ? ` — journée ${state.specialDay}` : ""}
        </p>
      )}

      <footer className="daily-checkin-widget-footer">
        <Link to={AppRoutes.DAILY_STATE_HISTORY}>Historique &amp; évolution</Link>
      </footer>
    </section>
  );
}

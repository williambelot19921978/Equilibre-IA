import type { AchievementFeedback } from "../../types/achievementFeedback";

type RecentAchievementWidgetProps = {
  achievement: AchievementFeedback | null;
  freedMinutes?: number;
  onDismiss: () => void;
};

export function RecentAchievementWidget({
  achievement,
  freedMinutes = 0,
  onDismiss,
}: RecentAchievementWidgetProps) {
  if (!achievement) return null;

  return (
    <section
      className={`recent-achievement recent-achievement-${achievement.celebrationLevel}`}
      role="status"
    >
      <div className="recent-achievement-icon" aria-hidden="true">
        {achievement.icon}
      </div>
      <div className="recent-achievement-body">
        <p className="recent-achievement-title">{achievement.title}</p>
        <p className="recent-achievement-message">{achievement.message}</p>
        {freedMinutes > 0 && (
          <p className="recent-achievement-meta">
            Objectif réalisé {freedMinutes} minutes en avance.
          </p>
        )}
        {achievement.followUpSuggestion && (
          <p className="recent-achievement-followup">{achievement.followUpSuggestion}</p>
        )}
      </div>
      <button type="button" className="recent-achievement-dismiss" onClick={onDismiss}>
        Fermer
      </button>
    </section>
  );
}

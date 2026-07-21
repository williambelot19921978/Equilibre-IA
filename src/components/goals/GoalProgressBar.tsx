type GoalProgressBarProps = {
  percent: number;
  completedTasks: number;
  totalTasks: number;
};

export function GoalProgressBar({
  percent,
  completedTasks,
  totalTasks,
}: GoalProgressBarProps) {
  const label =
    totalTasks === 0
      ? "Aucune tâche liée"
      : `${completedTasks}/${totalTasks} tâches terminées (${percent} %)`;

  return (
    <div className="goal-progress">
      <div
        className="goal-progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="goal-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="goal-progress-label">{label}</p>
    </div>
  );
}

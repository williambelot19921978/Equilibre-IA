/**
 * P1 — Natural recommendation copy from existing reasoner/suggestion data.
 * Presentation text only — no decision logic.
 */

export function formatStudyRecommendationMessage({
  slotMinutes,
  activityLabel,
  timingHint,
}: {
  slotMinutes: number;
  activityLabel: string;
  timingHint?: string;
}): string {
  const lines = [
    `Tu disposes d'environ ${slotMinutes} minutes.`,
    activityLabel,
    timingHint ?? "C'est probablement le meilleur moment aujourd'hui.",
  ];

  return lines.filter(Boolean).join("\n\n");
}

export function resolveStudyActivityLabel(
  taskTitle?: string,
  fallbackTitle?: string,
): string {
  if (taskTitle) {
    const normalized = taskTitle.trim();
    if (/^ton /i.test(normalized) || /^ta /i.test(normalized)) {
      return `Tu voulais avancer ${normalized}.`;
    }
    return `Tu voulais avancer ton ${normalized.toLowerCase()}.`;
  }

  if (fallbackTitle) {
    return `Tu voulais avancer : ${fallbackTitle.toLowerCase()}.`;
  }

  return "Tu voulais avancer ta révision.";
}

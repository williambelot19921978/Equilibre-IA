function formatTimeFr(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatStudyRescheduleProposalMessage({
  taskTitle,
  durationMinutes,
  startsAt,
  endsAt,
  justification,
}: {
  taskTitle: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  justification: string;
}): string {
  const startLabel = formatTimeFr(startsAt);
  const endLabel = formatTimeFr(endsAt);

  return [
    `Tu ne peux pas réviser maintenant.`,
    "",
    `Un créneau de ${durationMinutes} minutes est disponible aujourd'hui entre ${startLabel} et ${endLabel}.`,
    "",
    `Je peux déplacer « ${taskTitle} » à ce moment-là.`,
    "",
    justification,
  ].join("\n");
}

export function formatStudyRescheduleNoSolutionMessage(): string {
  return [
    "Je n'ai pas trouvé de créneau suffisamment long aujourd'hui.",
    "",
    "Ta tâche reste à son horaire actuel.",
  ].join("\n");
}

export function formatStudyRescheduleConflictMessage(): string {
  return [
    "Ce créneau n'est plus disponible.",
    "",
    "Aucun changement n'a été effectué.",
  ].join("\n");
}

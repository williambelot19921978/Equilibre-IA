/**
 * EPIC 6B — Life Transition Engine (bonus).
 * Détecte changements durables — propose mise à jour préférences, ne modifie jamais les habitudes.
 */

import type { CalendarEventInput, LifeTransitionKind, LifeTransitionSignal } from "../types/proactiveTypes";

const TRANSITION_MESSAGES: Record<LifeTransitionKind, string> = {
  new_job: "Nous avons détecté un changement durable (nouvel emploi). Souhaitez-vous mettre à jour vos préférences ?",
  schedule_change: "Nous avons détecté un changement d'horaires. Souhaitez-vous mettre à jour vos préférences ?",
  new_child: "Nous avons détecté un changement familial. Souhaitez-vous mettre à jour vos préférences ?",
  vacation: "Nous avons détecté une période de vacances. Souhaitez-vous mettre à jour vos préférences ?",
  post_vacation: "Reprise après vacances détectée. Souhaitez-vous mettre à jour vos préférences ?",
  relocation: "Changement de lieu détecté. Souhaitez-vous mettre à jour vos préférences ?",
  new_activity: "Nouvelle activité régulière détectée. Souhaitez-vous mettre à jour vos préférences ?",
};

function detectFromEvents(events: readonly CalendarEventInput[]): LifeTransitionSignal[] {
  const signals: LifeTransitionSignal[] = [];
  const now = new Date().toISOString();

  const workEvents = events.filter(
    (event) =>
      event.category === "travail" ||
      /travail|bureau|sprint|office/i.test(event.title),
  );
  const morningWork = workEvents.filter((event) => {
    const hour = new Date(event.start).getUTCHours();
    return hour >= 6 && hour <= 9;
  });
  const eveningWork = workEvents.filter((event) => {
    const hour = new Date(event.start).getUTCHours();
    return hour >= 17 && hour <= 21;
  });

  if (morningWork.length >= 3 && eveningWork.length === 0) {
    signals.push({
      id: `lt-schedule-${Date.now()}`,
      kind: "schedule_change",
      label: "Horaires matinaux",
      confidence: 0.72,
      message: TRANSITION_MESSAGES.schedule_change,
      detectedAt: now,
    });
  }

  const vacationEvents = events.filter((event) =>
    /vacances|vacation|congé|holiday/i.test(event.title),
  );
  if (vacationEvents.length >= 2) {
    signals.push({
      id: `lt-vacation-${Date.now()}`,
      kind: "vacation",
      label: "Vacances",
      confidence: 0.85,
      message: TRANSITION_MESSAGES.vacation,
      detectedAt: now,
    });
  }

  const sportEvents = events.filter(
    (event) => event.category === "sport" || /sport|fit|course/i.test(event.title),
  );
  if (sportEvents.length >= 4) {
    signals.push({
      id: `lt-activity-${Date.now()}`,
      kind: "new_activity",
      label: "Nouvelle activité sportive",
      confidence: 0.68,
      message: TRANSITION_MESSAGES.new_activity,
      detectedAt: now,
    });
  }

  return signals;
}

export function detectLifeTransitions(input: {
  readonly calendarEvents: readonly CalendarEventInput[];
  readonly onVacation?: boolean;
  readonly childrenCount?: number;
}): LifeTransitionSignal[] {
  const signals = detectFromEvents(input.calendarEvents);

  if (input.onVacation) {
    signals.push({
      id: `lt-vacation-flag-${Date.now()}`,
      kind: "vacation",
      label: "Mode vacances",
      confidence: 0.9,
      message: TRANSITION_MESSAGES.vacation,
      detectedAt: new Date().toISOString(),
    });
  }

  if ((input.childrenCount ?? 0) > 0) {
    const familyEvents = input.calendarEvents.filter(
      (event) => event.category === "famille" || /enfant|famille|école/i.test(event.title),
    );
    if (familyEvents.length >= 3) {
      signals.push({
        id: `lt-family-${Date.now()}`,
        kind: "new_child",
        label: "Contexte familial actif",
        confidence: 0.65,
        message: TRANSITION_MESSAGES.new_child,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return signals;
}

export class LifeTransitionEngine {
  detect(input: Parameters<typeof detectLifeTransitions>[0]): LifeTransitionSignal[] {
    return detectLifeTransitions(input);
  }
}

export const defaultLifeTransitionEngine = new LifeTransitionEngine();

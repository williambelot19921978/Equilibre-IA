import { addDaysToDate } from "../../lib/time/deviceClock";
import { expandDateRange } from "../../lib/planning/expandDateRange";
import { proposeHalfDayFreedActivity } from "../../lib/life/proposeHalfDayFreedActivity";
import type {
  NlpAction,
  NlpEntity,
  NlpIntent,
  NlpParseResult,
} from "../../types/nlp";

function dayBounds(date: string): { startsAt: string; endsAt: string } {
  return {
    startsAt: `${date}T00:00:00.000Z`,
    endsAt: `${date}T23:59:59.999Z`,
  };
}

function primaryDate(entities: NlpEntity, fallback: string): string {
  return entities.dates[0] ?? fallback;
}

function isDeleteSport(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    /\bsupprime\b/.test(normalized) ||
    /\bannule\b/.test(normalized) ||
    /\bretire\b/.test(normalized) ||
    /\benleve\b/.test(normalized) ||
    /\benlève\b/.test(normalized)
  );
}

function isRestDayIntent(text: string): boolean {
  const normalized = text.toLowerCase();
  const hasPartialPeriod =
    /\b(matin|matinee|matinée|apres-midi|après-midi|aprem)\b/.test(normalized);

  if (
    hasPartialPeriod &&
    (/\b(ne travaille pas|pas de travail|j'ai ma|j'ai mon|seulement|uniquement)\b/.test(
      normalized,
    ) ||
      /\btravail/.test(normalized))
  ) {
    return false;
  }

  return (
    /\b(repos|ne travaille pas|pas de travail)\b/.test(normalized) &&
    !/\bje travaille\b/.test(normalized)
  );
}

function isWorkDayIntent(text: string): boolean {
  const normalized = text.toLowerCase();
  return /\bje travaille\b/.test(normalized) || /\bjour de travail\b/.test(normalized);
}

function replanDatesFromEntities(entities: NlpEntity, fallbackDate: string): string[] {
  if (entities.dateRange) {
    return expandDateRange(entities.dateRange.start, entities.dateRange.end);
  }
  if (entities.dates.length > 0) {
    return entities.dates;
  }
  return [fallbackDate];
}

export function resolveActions({
  parseResult,
  referenceDate,
}: {
  parseResult: NlpParseResult;
  referenceDate: string;
}): {
  actions: NlpAction[];
  memoryProposal?: { prompt: string; actions: NlpAction[] };
} {
  const { intent, entities, rawText } = parseResult;
  const date = primaryDate(entities, referenceDate);

  switch (intent) {
    case "confirm":
    case "cancel":
      return { actions: [] };

    case "modify_vacation": {
      const range = entities.dateRange ?? {
        start: date,
        end: entities.dates[1] ?? date,
      };

      return {
        actions: [
          {
            type: "CreateVacationPeriod",
            payload: {
              title: "Vacances",
              startsAt: dayBounds(range.start).startsAt,
              endsAt: dayBounds(range.end).endsAt,
            },
            requiresConfirmation: false,
            explanation: `Période de vacances du ${range.start} au ${range.end}.`,
            reason:
              "Les vacances désactivent le travail habituel et adaptent les propositions.",
          },
          {
            type: "RebuildDay",
            payload: { dates: replanDatesFromEntities(entities, range.start) },
            requiresConfirmation: false,
            explanation: "Le planning sera recalculé sur cette période.",
            reason: "Life Engine relancé après changement de contexte.",
          },
        ],
      };
    }

    case "modify_travel": {
      const endDate = entities.dates[1] ?? addDaysToDate(date, 6);
      return {
        actions: [
          {
            type: "CreateWorkTravelPeriod",
            payload: {
              title: entities.person
                ? `${entities.person} en déplacement`
                : "Déplacement",
              startsAt: dayBounds(date).startsAt,
              endsAt: dayBounds(endDate).endsAt,
            },
            requiresConfirmation: false,
            explanation: `Déplacement enregistré à partir du ${date}.`,
            reason: "Le moteur réduit l'énergie et limite les propositions exigeantes.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Adaptation automatique au déplacement.",
          },
        ],
      };
    }

    case "modify_work": {
      const halfDayProposalSuffix = (affectedPeriod: "morning" | "afternoon") => {
        const proposal = proposeHalfDayFreedActivity({
          date,
          affectedPeriod,
          schoolContext: { childrenCount: 1 },
        });
        return ` ${proposal.message}`;
      };

      if (entities.workExceptionKind === "half_afternoon") {
        const workEnd = entities.workTimeEnd ?? entities.times[0];
        if (!workEnd) {
          return { actions: [] };
        }
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: {
                date,
                workEnd,
                halfDay: "afternoon_off",
                source: "conversation",
              },
              requiresConfirmation: false,
              explanation: `Matinée de travail conservée, après-midi libre le ${date} (fin à ${workEnd}).${halfDayProposalSuffix("afternoon")}`,
              reason: "Exception ponctuelle — le rythme habituel n'est pas modifié.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Demi-journée appliquée.",
            },
          ],
        };
      }

      if (entities.workExceptionKind === "half_morning") {
        const workStart = entities.workTimeStart ?? entities.times[0];
        if (!workStart) {
          return { actions: [] };
        }
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: {
                date,
                workStart,
                halfDay: "morning_off",
                source: "conversation",
              },
              requiresConfirmation: false,
              explanation: `Matin libre, reprise du travail à ${workStart} le ${date}.${halfDayProposalSuffix("morning")}`,
              reason: "Exception ponctuelle — le rythme habituel n'est pas modifié.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Demi-journée appliquée.",
            },
          ],
        };
      }

      if (entities.workExceptionKind === "work_morning_only") {
        const workStart = entities.workTimeStart ?? entities.times[0];
        const workEnd =
          entities.workTimeEnd ?? entities.times[1] ?? entities.times[0];
        if (!workStart || !workEnd) {
          return { actions: [] };
        }
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: {
                date,
                workStart,
                workEnd,
                halfDay: "work_morning_only",
                source: "conversation",
              },
              requiresConfirmation: false,
              explanation: `Travail uniquement le matin le ${date} (de ${workStart} à ${workEnd}).`,
              reason: "Exception ponctuelle — après-midi libre.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Demi-journée appliquée.",
            },
          ],
        };
      }

      if (entities.workExceptionKind === "work_afternoon_only") {
        const workStart = entities.workTimeStart ?? entities.times[0];
        if (!workStart) {
          return { actions: [] };
        }
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: {
                date,
                workStart,
                halfDay: "work_afternoon_only",
                source: "conversation",
              },
              requiresConfirmation: false,
              explanation: `Travail uniquement l'après-midi le ${date} (reprise à ${workStart}).`,
              reason: "Exception ponctuelle — matin libre.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Demi-journée appliquée.",
            },
          ],
        };
      }

      if (entities.workExceptionKind === "start_override") {
        const workStart = entities.workTimeStart ?? entities.times[0];
        if (!workStart) {
          return { actions: [] };
        }
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: { date, workStart, source: "conversation" },
              requiresConfirmation: false,
              explanation: `Début de travail à ${workStart} le ${date}.`,
              reason: "Horaire de début exceptionnel pour cette journée.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Les blocs travail sont mis à jour.",
            },
          ],
        };
      }

      if (entities.workExceptionKind === "end_override") {
        const workEnd = entities.workTimeEnd ?? entities.times[0];
        if (!workEnd) {
          return { actions: [] };
        }
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: { date, workEnd, source: "conversation" },
              requiresConfirmation: false,
              explanation: `Fin de travail exceptionnelle à ${workEnd} le ${date}.`,
              reason: "Horaire de fin ponctuel — rythme habituel conservé.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Les blocs travail et trajets sont mis à jour.",
            },
          ],
        };
      }

      if (entities.workTimeStart && entities.workTimeEnd) {
        return {
          actions: [
            {
              type: "MarkWorkDay",
              payload: {
                date,
                workStart: entities.workTimeStart,
                workEnd: entities.workTimeEnd,
              },
              requiresConfirmation: false,
              explanation: `Travail de ${entities.workTimeStart} à ${entities.workTimeEnd} pour le ${date}.`,
              reason: "Horaires exceptionnels enregistrés pour cette journée.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Les blocs travail sont mis à jour.",
            },
          ],
        };
      }

      if (entities.durationDeltaMinutes) {
        return {
          actions: [
            {
              type: "UpdateWorkScheduleToday",
              payload: {
                date,
                endDeltaMinutes: entities.durationDeltaMinutes,
              },
              requiresConfirmation: false,
              explanation: `Fin de travail prolongée d'une heure pour le ${date}.`,
              reason: "Modification ponctuelle — uniquement aujourd'hui.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Les blocs travail et trajets sont mis à jour.",
            },
          ],
        };
      }

      if (entities.recurring && entities.weekdays && entities.weekdays.length > 0) {
        const recurringActions: NlpAction[] = [
          {
            type: isRestDayIntent(rawText)
              ? "UpdateWorkSchedulePermanent"
              : "UpdateWorkSchedulePermanent",
            payload: {
              removeWorkDays: isRestDayIntent(rawText) ? entities.weekdays : [],
              addWorkDays: isWorkDayIntent(rawText) ? entities.weekdays : [],
            },
            requiresConfirmation: true,
            explanation: isRestDayIntent(rawText)
              ? `Repos récurrent les ${entities.weekdays.join(", ")}.`
              : `Travail récurrent les ${entities.weekdays.join(", ")}.`,
            reason: "Changement de rythme habituel — impact sur toutes les semaines.",
          },
        ];

        return {
          actions: [],
          memoryProposal: {
            prompt: isRestDayIntent(rawText)
              ? "Veux-tu modifier ton rythme habituel pour te libérer ces jours-là ?"
              : "Veux-tu modifier ton rythme habituel de travail ?",
            actions: recurringActions,
          },
        };
      }

      if (isRestDayIntent(rawText) || entities.workExceptionKind === "cancel") {
        return {
          actions: [
            {
              type: "MarkRestDay",
              payload: { date },
              requiresConfirmation: false,
              explanation: `Journée de repos enregistrée pour le ${date}.`,
              reason: "Le travail habituel est suspendu pour cette journée.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé en mode repos.",
              reason: "Propositions adaptées : sport, calme, famille.",
            },
          ],
        };
      }

      return {
        actions: [
          {
            type: "MarkWorkDay",
            payload: { date },
            requiresConfirmation: false,
            explanation: `Journée de travail enregistrée pour le ${date}.`,
            reason: "Les blocs trajet et travail seront visibles même sans Google.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Life Engine traite cette journée comme un jour ouvré.",
          },
        ],
      };
    }

    case "declare_fatigue":
      return {
        actions: [
          {
            type: "ReduceFillRatio",
            payload: { date, maxFillRatio: 0.4, reason: "fatigue" },
            requiresConfirmation: false,
            explanation: "Journée allégée — charge réduite automatiquement.",
            reason: "Tu as indiqué être fatigué(e) : moins de remplissage, formats courts.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé plus léger.",
            reason: "Les tâches non urgentes peuvent être reportées.",
          },
        ],
      };

    case "quiet_evening":
      return {
        actions: [
          {
            type: "QuietEvening",
            payload: { date },
            requiresConfirmation: false,
            explanation: "Soirée tranquille activée — propositions exigeantes retirées.",
            reason: "Priorité au calme et au repos ce soir.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Adaptation du reste de la journée.",
          },
        ],
      };

    case "modify_sport": {
      if (isDeleteSport(rawText)) {
        return {
          actions: [
            {
              type: "DeleteSportTasks",
              payload: {
                scope: entities.scope === "period" ? "week" : "matching",
                date,
              },
              requiresConfirmation: true,
              explanation: `Suppression du sport prévu pour le ${date}.`,
              reason: "Action importante — confirmation demandée.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé sans sport.",
              reason: "Les créneaux libérés sont réorganisés.",
            },
          ],
        };
      }

      const duration = entities.durationMinutes ?? 30;
      const targetDate = entities.dates.includes(addDaysToDate(referenceDate, 1))
        ? addDaysToDate(referenceDate, 1)
        : date;

      return {
        actions: [
          {
            type: "CreateWorkoutTask",
            payload: {
              date: targetDate,
              durationMinutes: duration,
              title: `Course / sport — ${duration} min`,
            },
            requiresConfirmation: false,
            explanation: `Séance sportive de ${duration} min prévue.`,
            reason: "Une tâche sport sera créée et intégrée au planning.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [targetDate] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Life Engine cherche le meilleur créneau.",
          },
        ],
      };
    }

    case "modify_spiritual": {
      const targetDate = /\bce soir\b/i.test(rawText) ? referenceDate : date;
      return {
        actions: [
          {
            type: "CreatePrayerBlock",
            payload: {
              date: targetDate,
              durationMinutes: entities.durationMinutes ?? 15,
              preferredMoment: /\bce soir\b/i.test(rawText) ? "evening" : undefined,
            },
            requiresConfirmation: false,
            explanation: "Moment spirituel ajouté à ta journée.",
            reason: "Bloc protégé dans le planning, sans lancement automatique.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [targetDate] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Le moment spirituel est intégré au reste de la journée.",
          },
        ],
      };
    }

    case "modify_study": {
      if (/\blire\b|\blecture\b/.test(rawText.toLowerCase())) {
        const duration = entities.durationMinutes ?? 30;
        return {
          actions: [
            {
              type: "CreateReadingBlock",
              payload: {
                date,
                durationMinutes: duration,
                title: `Lecture — ${duration} min`,
              },
              requiresConfirmation: false,
              explanation: `Bloc lecture de ${duration} min ajouté.`,
              reason: "Temps calme protégé dans le planning.",
            },
            {
              type: "RebuildDay",
              payload: { dates: [date] },
              requiresConfirmation: false,
              explanation: "Planning recalculé.",
              reason: "Life Engine ajuste les autres blocs.",
            },
          ],
        };
      }

      return {
        actions: [
          {
            type: "CreateWorkoutTask",
            payload: {
              date,
              durationMinutes: entities.durationMinutes ?? 25,
              title: "Révision",
              category: "studies",
            },
            requiresConfirmation: false,
            explanation: "Tâche de révision créée.",
            reason: "Intégrée au prochain créneau disponible.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Priorité selon ton énergie et tes contraintes.",
          },
        ],
      };
    }

    case "modify_calendar": {
      const appointmentTime = entities.times[0];
      const title = /\brdv\b/i.test(rawText) ? "Rendez-vous" : "Rendez-vous";
      const endTime = entities.times[1] ?? undefined;

      return {
        actions: [
          {
            type: "CreateAppointment",
            payload: {
              date,
              startTime: appointmentTime,
              endTime,
              title,
            },
            requiresConfirmation: false,
            explanation: appointmentTime
              ? `Rendez-vous ajouté demain à ${appointmentTime.replace(":", " h ")}.`
              : "Rendez-vous ajouté.",
            reason: "Bloc calendrier créé et intégré au planning.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Le rendez-vous est pris en compte.",
          },
        ],
      };
    }

    case "modify_children": {
      const childName = entities.childName ?? "Enfant";
      const targetDate = entities.weekday
        ? entities.dates[0] ?? date
        : date;
      const title = entities.location
        ? `${childName} chez ${entities.location}`
        : `${childName} — garde exceptionnelle`;

      return {
        actions: [
          {
            type: "CreateChildContextPeriod",
            payload: {
              title,
              startsAt: dayBounds(targetDate).startsAt,
              endsAt: dayBounds(targetDate).endsAt,
              contextType: entities.location ? "child_absent" : "exceptional_childcare",
              childName,
              location: entities.location,
            },
            requiresConfirmation: false,
            explanation: `Contexte enfant mis à jour pour le ${targetDate}.`,
            reason: "Routine scolaire et propositions adaptées automatiquement.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [targetDate] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Life Engine tient compte du nouveau contexte familial.",
          },
        ],
      };
    }

    case "modify_sleep":
      return {
        actions: [
          {
            type: "UpdateSleep",
            payload: {
              bedTime: entities.times[0],
            },
            requiresConfirmation: true,
            explanation: entities.times[0]
              ? `Heure de coucher modifiée à ${entities.times[0]}.`
              : "Modification du sommeil enregistrée.",
            reason: "Changement durable — confirmation recommandée.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Les créneaux du soir sont réajustés.",
          },
        ],
      };

    case "modify_tasks":
      return {
        actions: [
          {
            type: "DeleteSportTasks",
            payload: { scope: "matching", titleHint: rawText },
            requiresConfirmation: true,
            explanation: "Suppression des tâches correspondantes.",
            reason: "Action de suppression — confirmation demandée.",
          },
          {
            type: "RebuildDay",
            payload: { dates: [date] },
            requiresConfirmation: false,
            explanation: "Planning recalculé.",
            reason: "Les créneaux libérés sont réorganisés.",
          },
        ],
      };

    case "request_suggestion":
    case "ask_question":
      return {
        actions: [
          {
            type: "ExplainDay",
            payload: { date },
            requiresConfirmation: false,
            explanation: "Analyse de ta journée en cours.",
            reason: "Life Engine explique le type de journée et les propositions.",
          },
        ],
      };

    default:
      return {
        actions: [
          {
            type: "NoOp",
            payload: {},
            requiresConfirmation: false,
            explanation: "Je n'ai pas reconnu cette demande.",
            reason:
              "Essaie par exemple : « Je travaille demain », « Je suis en vacances du 10 au 18 août », « Supprime mon sport ».",
          },
        ],
      };
  }
}

export function buildConfirmationPrompt(actions: NlpAction[]): string {
  const destructive = actions.find(
    (action) =>
      action.type === "DeleteSportTasks" ||
      action.type === "CancelTasksByCategory",
  );

  if (destructive?.type === "DeleteSportTasks") {
    return "Tu souhaites bien supprimer les séances de sport concernées ?";
  }

  const needsConfirm = actions.filter((action) => action.requiresConfirmation);
  if (needsConfirm.length === 0) {
    return "Confirmer ces modifications ?";
  }

  return needsConfirm.map((action) => action.explanation).join(" ");
}

export function formatAssistantReply({
  intent,
  actions,
  executionSummaries,
  executionFailed = false,
  executionResult,
}: {
  intent: NlpIntent;
  actions: NlpAction[];
  executionSummaries: string[];
  executionFailed?: boolean;
  executionResult?: import("../../types/nlp").NlpExecutionResult;
}): string {
  const markWorkAction = actions.find((action) => action.type === "MarkWorkDay");
  const isMorningWork =
    markWorkAction?.payload.halfDay === "work_morning_only";

  if (executionResult && !executionResult.persistSucceeded) {
    return `Je n'ai pas réussi à ajouter ce travail : ${executionResult.persistError ?? executionSummaries.join(" ")}`;
  }

  if (executionResult && executionResult.persistSucceeded && !executionResult.replanSucceeded) {
    return "Le travail est enregistré, mais je n'ai pas réussi à recalculer le planning.";
  }

  if (
    executionResult &&
    markWorkAction &&
    executionResult.persistSucceeded &&
    executionResult.replanSucceeded &&
    !executionResult.workBlocksVerified
  ) {
    return "Le travail est enregistré, mais les blocs trajet/travail ne sont pas encore visibles. Ouvre le planning et recalcule la journée.";
  }

  if (executionFailed) {
    return `Je n'ai pas réussi à appliquer cette modification.\n\n${executionSummaries.join("\n")}`;
  }

  if (intent === "unknown") {
    return actions[0]?.explanation ?? "Je n'ai pas compris.";
  }

  const hasRealAction = actions.some(
    (action) => action.type !== "NoOp" && action.type !== "ExplainDay",
  );

  let intro = "";
  if (hasRealAction) {
    if (intent === "declare_fatigue") {
      intro = "Je comprends.";
    } else if (intent === "quiet_evening") {
      intro = "Très bien.";
    } else if (isMorningWork && executionResult?.workBlocksVerified) {
      intro =
        "C'est fait. J'ai ajouté ton travail demain matin et recalculé la journée.";
    } else if (executionResult?.persistSucceeded && executionResult.replanSucceeded) {
      intro = "C'est fait.";
    } else if (hasRealAction) {
      intro = "C'est fait.";
    }
  }

  const body = executionSummaries.length > 0
    ? executionSummaries.join("\n")
    : actions.map((action) => action.explanation).join("\n");

  const reasons = actions
    .map((action) => action.reason)
    .filter(Boolean)
    .slice(0, 2);

  if (reasons.length === 0) {
    return [intro, body].filter(Boolean).join(intro ? "\n\n" : "");
  }

  return [intro, body, reasons.join(" ")].filter(Boolean).join("\n\n");
}

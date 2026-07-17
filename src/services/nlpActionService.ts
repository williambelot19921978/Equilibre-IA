import { LIFE_DAY_TYPE_LABELS } from "../types/lifeContext";
import type { NlpAction } from "../types/nlp";
import type { NlpExecutionResult } from "../types/nlp";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { parseTimeToMinutes, minutesToTime } from "../lib/time/daySchedule";
import { verifyWorkBlocksInPlan } from "../lib/work/verifyWorkBlocksInPlan";
import { dispatchPlanRefresh } from "../lib/planning/planRefreshEvents";
import { loadPlanningContextWithLife } from "./memoryContextService";
import { createFamilyContextPeriod } from "./familyContextService";
import { createTask, getUserTasks, updateTaskStatus } from "./tasksService";
import { loadDailyRoutine, saveDailyRoutine } from "./dailyRoutineService";
import { addSpiritualActivityToPlanning } from "./spiritualPlanningService";
import { generateAndSaveDayPlan } from "./planningService";
import { getChildrenByHousehold } from "./childrenService";
import { createManualConstraint } from "./calendarService";
import { getCurrentHouseholdId } from "./householdService";

function uniqueDates(dates: string[]): string[] {
  return [...new Set(dates.filter(Boolean))];
}

async function replanDates(
  userId: string,
  dates: string[],
): Promise<Array<{ date: string; success: boolean; error?: string; workBlocksVerified?: boolean }>> {
  const results: Array<{
    date: string;
    success: boolean;
    error?: string;
    workBlocksVerified?: boolean;
  }> = [];

  for (const date of uniqueDates(dates)) {
    try {
      const generated = await generateAndSaveDayPlan({ userId, date });
      const verification = verifyWorkBlocksInPlan(generated.plan);
      results.push({
        date,
        success: true,
        workBlocksVerified: verification.complete,
      });
    } catch (error) {
      results.push({
        date,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

export async function executeNlpActions({
  userId,
  actions,
  referenceDate = getCurrentDeviceDate(),
}: {
  userId: string;
  actions: NlpAction[];
  referenceDate?: string;
}): Promise<NlpExecutionResult> {
  const summaries: string[] = [];
  const explanation: string[] = [];
  const datesToReplan: string[] = [];
  let persistSucceeded = true;
  let persistError: string | undefined;

  for (const action of actions) {
    try {
    switch (action.type) {
      case "CreateVacationPeriod": {
        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "user_vacation",
            title: String(action.payload.title ?? "Vacances"),
            startsAt: String(action.payload.startsAt),
            endsAt: String(action.payload.endsAt),
            userId,
          },
        });
        summaries.push("Période de vacances créée.");
        explanation.push(action.reason);
        break;
      }

      case "CreateWorkTravelPeriod": {
        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "work_travel",
            title: String(action.payload.title ?? "Déplacement"),
            startsAt: String(action.payload.startsAt),
            endsAt: String(action.payload.endsAt),
            userId,
          },
        });
        summaries.push("Déplacement enregistré.");
        explanation.push(action.reason);
        break;
      }

      case "MarkWorkDay": {
        const date = String(action.payload.date ?? referenceDate);
        const workStart = action.payload.workStart as string | undefined;
        const workEnd = action.payload.workEnd as string | undefined;
        const halfDay = action.payload.halfDay as string | undefined;
        const source = (action.payload.source as "user" | "conversation") ?? "conversation";
        const bounds = {
          startsAt: `${date}T00:00:00.000Z`,
          endsAt: `${date}T23:59:59.999Z`,
        };

        let title = "Journée de travail exceptionnelle";
        const impact: import("../types/familyContext").FamilyContextImpact = {
          forceWorkDay: true,
          workExceptionSource: source,
        };

        if (halfDay === "morning_off") {
          title = "Matin sans travail";
          impact.workStartOverride = workStart;
          impact.workExceptionType = "no_work_morning";
          impact.affectedPeriod = "morning";
          impact.workExceptionReason = "Absence travail matin";
        } else if (halfDay === "afternoon_off") {
          title = "Après-midi sans travail";
          impact.workEndOverride = workEnd;
          impact.workExceptionType = "no_work_afternoon";
          impact.affectedPeriod = "afternoon";
          impact.workExceptionReason = "Absence travail après-midi";
        } else if (halfDay === "work_morning_only") {
          title = "Travail matin uniquement";
          if (workStart) impact.workStartOverride = workStart;
          impact.workEndOverride = workEnd;
          impact.workExceptionType = "work_morning_only";
          impact.affectedPeriod = "morning";
          impact.workExceptionReason = "Travail limité au matin";
        } else if (halfDay === "work_afternoon_only") {
          title = "Travail après-midi uniquement";
          impact.workStartOverride = workStart;
          impact.workExceptionType = "work_afternoon_only";
          impact.affectedPeriod = "afternoon";
          impact.workExceptionReason = "Travail limité à l'après-midi";
        } else {
          if (workStart) impact.workStartOverride = workStart;
          if (workEnd) impact.workEndOverride = workEnd;
          if (workStart && workEnd) {
            impact.workExceptionType = "custom_work_hours";
            impact.affectedPeriod = "full_day";
          }
        }

        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "exceptional_work_hours",
            title,
            startsAt: bounds.startsAt,
            endsAt: bounds.endsAt,
            userId,
            impact,
          },
        });
        summaries.push(
          halfDay === "morning_off" && workStart
            ? `Matin libre, reprise à ${workStart} le ${date}.`
            : halfDay === "afternoon_off" && workEnd
              ? `Après-midi libre, matin jusqu'à ${workEnd} le ${date}.`
              : halfDay === "work_morning_only" && workStart && workEnd
                ? `Travail demain matin de ${workStart} à ${workEnd} le ${date}.`
                : workStart && workEnd
                  ? `Travail de ${workStart} à ${workEnd} pour le ${date}.`
                  : `Journée de travail activée pour le ${date}.`,
        );
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "MarkRestDay": {
        const date = String(action.payload.date ?? referenceDate);
        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "other",
            title: "Journée de repos",
            startsAt: `${date}T00:00:00.000Z`,
            endsAt: `${date}T23:59:59.999Z`,
            userId,
            impact: {
              disableWork: true,
              workExceptionType: "no_work_full_day",
              affectedPeriod: "full_day",
              workExceptionSource: "conversation",
            },
          },
        });
        summaries.push(`Journée de repos enregistrée pour le ${date}.`);
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "UpdateWorkScheduleToday": {
        const date = String(action.payload.date ?? referenceDate);
        const delta = Number(action.payload.endDeltaMinutes ?? 60);
        const routine = await loadDailyRoutine(userId);
        const currentEnd =
          parseTimeToMinutes(routine.workEnd || "17:00") ?? 17 * 60;
        const newEnd = minutesToTime(currentEnd + delta);

        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "exceptional_work_hours",
            title: "Fin de travail prolongée",
            startsAt: `${date}T00:00:00.000Z`,
            endsAt: `${date}T23:59:59.999Z`,
            userId,
            impact: {
              workEndOverride: newEnd,
              forceWorkDay: true,
            },
          },
        });
        summaries.push(`Fin de travail à ${newEnd} pour le ${date}.`);
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "UpdateWorkSchedulePermanent": {
        const routine = await loadDailyRoutine(userId);
        const removeWorkDays = (action.payload.removeWorkDays as string[]) ?? [];
        const addWorkDays = (action.payload.addWorkDays as string[]) ?? [];
        const nextWorkDays = [
          ...new Set([
            ...routine.workDays.filter((day) => !removeWorkDays.includes(day)),
            ...addWorkDays,
          ]),
        ];

        await saveDailyRoutine({
          userId,
          routine: {
            ...routine,
            workDays: nextWorkDays,
          },
        });
        summaries.push("Rythme habituel mis à jour.");
        explanation.push(action.reason);
        break;
      }

      case "CreateWorkoutTask": {
        const date = String(action.payload.date ?? referenceDate);
        const duration = Number(action.payload.durationMinutes ?? 30);
        const category = String(action.payload.category ?? "sport");
        const title = String(action.payload.title ?? `Sport — ${duration} min`);

        await createTask({
          userId,
          title,
          category,
          estimatedMinutes: duration,
          dueAt: `${date}T12:00:00.000Z`,
          priority: category === "studies" ? 4 : 3,
          splittable: category === "studies",
        });
        summaries.push(`Tâche « ${title} » créée.`);
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "CreateReadingBlock": {
        const date = String(action.payload.date ?? referenceDate);
        const duration = Number(action.payload.durationMinutes ?? 30);
        const title = String(action.payload.title ?? `Lecture — ${duration} min`);

        await createTask({
          userId,
          title,
          category: "personal",
          estimatedMinutes: duration,
          dueAt: `${date}T18:00:00.000Z`,
          priority: 2,
          splittable: true,
        });
        summaries.push(`Bloc lecture de ${duration} min ajouté.`);
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "CreatePrayerBlock": {
        const date = String(action.payload.date ?? referenceDate);
        const duration = Number(action.payload.durationMinutes ?? 15);
        const preferredMoment = action.payload.preferredMoment as
          | string
          | undefined;

        const result = await addSpiritualActivityToPlanning({
          userId,
          date,
          title: "Moment spirituel",
          durationMinutes: duration,
          schedule: preferredMoment === "evening" ? "custom" : "next_free",
          preferredMoment,
          spiritualActivityType: "prayer",
          sourceReason: "Ajouté via conversation naturelle.",
        });
        summaries.push(result.explanation);
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "CreateAppointment": {
        const date = String(action.payload.date ?? referenceDate);
        const startTime = String(action.payload.startTime ?? "14:00");
        const endMinutes =
          (Number.parseInt(startTime.slice(0, 2), 10) * 60 +
            Number.parseInt(startTime.slice(3, 5), 10) +
            60) %
          (24 * 60);
        const endHour = String(Math.floor(endMinutes / 60)).padStart(2, "0");
        const endMin = String(endMinutes % 60).padStart(2, "0");
        const endTime = String(action.payload.endTime ?? `${endHour}:${endMin}`);
        const title = String(action.payload.title ?? "Rendez-vous");

        await createManualConstraint({
          userId,
          date,
          title,
          constraintType: "appointment",
          startTime,
          endTime,
        });
        summaries.push(`Rendez-vous ajouté le ${date} à ${startTime}.`);
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "DeleteSportTasks": {
        const tasks = await getUserTasks(userId);
        const targetDate = action.payload.date as string | undefined;
        const sportTasks = tasks.filter((task) => {
          if (task.category !== "sport") return false;
          if (task.status === "cancelled" || task.status === "done") return false;
          if (!targetDate || !task.due_at) return true;
          return task.due_at.startsWith(targetDate);
        });

        for (const task of sportTasks) {
          await updateTaskStatus({ taskId: task.id, status: "cancelled" });
        }

        summaries.push(
          sportTasks.length > 0
            ? `${sportTasks.length} séance(s) de sport supprimée(s).`
            : "Aucune séance de sport active trouvée pour cette date.",
        );
        if (targetDate) datesToReplan.push(targetDate);
        explanation.push(action.reason);
        break;
      }

      case "CreateChildContextPeriod": {
        const householdId = await getCurrentHouseholdId(userId);
        const children = await getChildrenByHousehold(householdId);
        const childName = String(action.payload.childName ?? "");
        const child = children.find(
          (item) =>
            item.first_name.toLowerCase() === childName.toLowerCase(),
        );

        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: (action.payload.contextType as
              | "child_absent"
              | "exceptional_childcare") ?? "child_absent",
            title: String(action.payload.title ?? "Contexte enfant"),
            startsAt: String(action.payload.startsAt),
            endsAt: String(action.payload.endsAt),
            affectedMemberId: child?.id ?? null,
            description: action.payload.location
              ? `Lieu : ${String(action.payload.location)}`
              : null,
          },
        });
        summaries.push("Contexte enfant mis à jour.");
        explanation.push(action.reason);
        break;
      }

      case "UpdateSleep": {
        const bedTime = action.payload.bedTime as string | undefined;
        if (bedTime) {
          const routine = await loadDailyRoutine(userId);
          await saveDailyRoutine({
            userId,
            routine: { ...routine, bedTime },
          });
          summaries.push(`Heure de coucher mise à ${bedTime}.`);
        }
        explanation.push(action.reason);
        break;
      }

      case "ReduceFillRatio": {
        const date = String(action.payload.date ?? referenceDate);
        const maxFillRatio = Number(action.payload.maxFillRatio ?? 0.4);
        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "other",
            title: "Journée allégée — fatigue",
            startsAt: `${date}T00:00:00.000Z`,
            endsAt: `${date}T23:59:59.999Z`,
            userId,
            impact: {
              maxFillRatio,
              onlyMicroTasks: true,
              reducePersonalTasks: true,
            },
          },
        });
        summaries.push("Charge réduite pour aujourd'hui.");
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "QuietEvening": {
        const date = String(action.payload.date ?? referenceDate);
        await createFamilyContextPeriod({
          userId,
          period: {
            contextType: "other",
            title: "Soirée tranquille",
            startsAt: `${date}T00:00:00.000Z`,
            endsAt: `${date}T23:59:59.999Z`,
            userId,
            impact: {
              maxFillRatio: 0.3,
              avoidLongTasks: true,
              onlyMicroTasks: true,
            },
          },
        });
        summaries.push("Soirée tranquille — propositions exigeantes retirées.");
        datesToReplan.push(date);
        explanation.push(action.reason);
        break;
      }

      case "ExplainDay": {
        const date = String(action.payload.date ?? referenceDate);
        const context = await loadPlanningContextWithLife({ userId, date });
        if (context?.lifeContext) {
          const lc = context.lifeContext;
          summaries.push(
            `${LIFE_DAY_TYPE_LABELS[lc.dayType]} — ${lc.dayTypeReason}`,
          );
          if (lc.proposals[1]) {
            summaries.push(
              `Proposition : ${lc.proposals[1].title} — ${lc.proposals[1].reason}`,
            );
          }
        } else {
          summaries.push("Je n'ai pas pu analyser ta journée.");
        }
        explanation.push(action.reason);
        break;
      }

      case "RebuildDay": {
        const dates = (action.payload.dates as string[]) ?? [referenceDate];
        datesToReplan.push(...dates);
        break;
      }

      case "NoOp":
        summaries.push(action.explanation);
        explanation.push(action.reason);
        break;

      default:
        break;
    }
    } catch (actionError) {
      persistSucceeded = false;
      persistError =
        actionError instanceof Error ? actionError.message : String(actionError);
      summaries.push(`Échec : ${persistError}`);
      if (import.meta.env.DEV) {
        console.error("[NLP ACTION FAILED]", action.type, actionError);
      }
    }
  }

  const replan = uniqueDates(datesToReplan);
  const replanResults = await replanDates(userId, replan);
  const replanFailures = replanResults
    .filter((result) => !result.success)
    .map((result) => `${result.date}: ${result.error ?? "erreur inconnue"}`);
  const replanSucceeded = replan.length === 0 || replanFailures.length === 0;
  const markWorkDates = new Set(
    actions
      .filter((action) => action.type === "MarkWorkDay")
      .map((action) => String(action.payload.date ?? referenceDate)),
  );
  const workBlocksVerified =
    markWorkDates.size === 0 ||
    [...markWorkDates].every((date) => {
      const result = replanResults.find((entry) => entry.date === date);
      return Boolean(result?.success && result.workBlocksVerified);
    });

  if (replan.length > 0) {
    dispatchPlanRefresh(replan);
  }

  if (import.meta.env.DEV) {
    console.log("[NLP REPLAN]", {
      dates: replan,
      replanResults,
      persistSucceeded,
    });
  }

  return {
    summaries,
    replanDates: replan,
    explanation,
    persistSucceeded,
    replanSucceeded,
    replanFailures,
    workBlocksVerified,
    persistError,
  };
}

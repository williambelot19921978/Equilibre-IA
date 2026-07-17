import {
  isSchoolDayForChildren,
  type SchoolDayContext,
} from "../family/isSchoolDayForChildren";
import type { WorkAffectedPeriod } from "../work/workExceptionTypes";

export type HalfDayProposalType =
  | "revision"
  | "task"
  | "sport"
  | "admin"
  | "calm"
  | "family"
  | "outing"
  | "walk"
  | "game"
  | "leisure"
  | "keep_free";

export type HalfDayFreedProposal = {
  mainProposal: {
    type: HalfDayProposalType;
    title: string;
    durationMinutes?: number;
  };
  message: string;
};

export type ProposeHalfDayFreedActivityInput = {
  date: string;
  affectedPeriod: WorkAffectedPeriod;
  schoolContext: SchoolDayContext;
  fatigueHigh?: boolean;
  sportAlreadyDone?: boolean;
  studyPossible?: boolean;
};

function periodLabel(period: WorkAffectedPeriod): string {
  return period === "morning" ? "matinée" : "après-midi";
}

export function proposeHalfDayFreedActivity(
  input: ProposeHalfDayFreedActivityInput,
): HalfDayFreedProposal {
  const { affectedPeriod, schoolContext } = input;
  const periodName = periodLabel(affectedPeriod);
  const schoolDay = isSchoolDayForChildren(input.date, schoolContext);

  if (input.fatigueHigh) {
    return {
      mainProposal: {
        type: "calm",
        title: "Temps calme",
        durationMinutes: 30,
      },
      message: `Ta ${periodName} est libre. Vu ta fatigue, je te propose un moment calme, puis je garde le reste libre.`,
    };
  }

  if (schoolDay) {
    if (input.studyPossible !== false) {
      return {
        mainProposal: {
          type: "revision",
          title: "Révision",
          durationMinutes: 45,
        },
        message: `Ta ${periodName} est libre demain. Comme c'est un jour de semaine et que les enfants sont à l'école, je te propose 45 minutes de révision, puis je garde le reste libre.`,
      };
    }

    return {
      mainProposal: {
        type: "task",
        title: "Tâche personnelle",
        durationMinutes: 45,
      },
      message: `Ta ${periodName} est libre. Je te propose une tâche personnelle importante, puis je garde le reste libre.`,
    };
  }

  if (!input.sportAlreadyDone && input.studyPossible !== false) {
    return {
      mainProposal: {
        type: "family",
        title: "Activité en famille",
        durationMinutes: 60,
      },
      message: `Ton ${periodName} est libre. Je te propose une activité en famille, ou tu peux conserver ce temps libre.`,
    };
  }

  return {
    mainProposal: {
      type: "family",
      title: "Sortie ou promenade",
      durationMinutes: 60,
    },
    message: `Ton ${periodName} est libre. Je te propose une sortie ou une promenade en famille, puis le reste reste libre.`,
  };
}

import type { NlpIntent, NlpParseResult } from "../../types/nlp";

export type ClarificationResult = {
  needsClarification: boolean;
  message?: string;
};

export function detectClarificationNeeded(
  parseResult: NlpParseResult,
): ClarificationResult {
  const { intent, entities, rawText } = parseResult;
  const text = rawText.toLowerCase();

  if (intent === "modify_work") {
    if (entities.workExceptionKind === "half_morning") {
      if (
        entities.times.length === 0 &&
        !entities.workTimeStart
      ) {
        return {
          needsClarification: true,
          message: "À quelle heure reprends-tu le travail demain ?",
        };
      }
    }

    if (entities.workExceptionKind === "half_afternoon") {
      if (
        entities.times.length === 0 &&
        !entities.workTimeEnd
      ) {
        return {
          needsClarification: true,
          message:
            "À quelle heure se termine ta matinée de travail ? (ex. 12 h ou 12 h 30)",
        };
      }
    }

    if (entities.workExceptionKind === "work_morning_only") {
      if (
        !entities.workTimeStart ||
        !entities.workTimeEnd ||
        (entities.times.length < 2 && !entities.workTimeEnd)
      ) {
        return {
          needsClarification: true,
          message:
            "À quelle heure commences-tu et à quelle heure termines-tu demain matin ?",
        };
      }
    }

    if (entities.workExceptionKind === "work_afternoon_only") {
      if (entities.times.length === 0 && !entities.workTimeStart) {
        return {
          needsClarification: true,
          message: "À quelle heure reprends-tu le travail demain après-midi ?",
        };
      }
    }
  }

  if (intent === "modify_work") {
    const vagueLater =
      (/\bplus tard\b/.test(text) || /\btravaille plus\b/.test(text)) &&
      !entities.durationDeltaMinutes &&
      entities.times.length === 0;

    if (vagueLater) {
      return {
        needsClarification: true,
        message:
          "D'accord. Pour quel jour et jusqu'à quelle heure veux-tu prolonger le travail ?",
      };
    }

    const workWithHours =
      /\bde\s+\d/.test(text) &&
      entities.times.length >= 1 &&
      !entities.dateRange &&
      entities.dates.length <= 1 &&
      !/\bdemain\b/.test(text) &&
      !entities.weekday;

    if (workWithHours && entities.times.length === 1) {
      return {
        needsClarification: true,
        message:
          "Pour quel jour souhaites-tu appliquer ces horaires de travail ?",
      };
    }
  }

  if (intent === "modify_vacation") {
    const noDates =
      !entities.dateRange &&
      entities.dates.length <= 1 &&
      !/\bdu\s+\d/.test(text);

    if (noDates && !/\bce week-end\b/.test(text) && !/\bcette semaine\b/.test(text)) {
      return {
        needsClarification: true,
        message:
          "Tu es en vacances — sur quelles dates exactement ? (ex. du 10 au 18 août)",
      };
    }
  }

  if (intent === "modify_sport" && /\bsport\b/.test(text) && !entities.durationMinutes) {
    const isDelete =
      /\bsupprime\b/.test(text) ||
      /\bannule\b/.test(text) ||
      /\bretire\b/.test(text);

    if (!isDelete && !/\bcourir\b/.test(text) && !/\bcourse\b/.test(text)) {
      return {
        needsClarification: true,
        message: "Combien de temps veux-tu consacrer au sport ?",
      };
    }
  }

  if (intent === "modify_calendar") {
    if (entities.times.length === 0) {
      return {
        needsClarification: true,
        message: "À quelle heure est ce rendez-vous ?",
      };
    }
  }

  if (intent === "unknown") {
    return { needsClarification: false };
  }

  return { needsClarification: false };
}

export function buildClarificationForIntent(intent: NlpIntent): string | null {
  if (intent === "unknown") {
    return "Je n'ai pas bien compris. Peux-tu préciser ce que tu veux modifier (travail, vacances, sport, rendez-vous…) ?";
  }
  return null;
}

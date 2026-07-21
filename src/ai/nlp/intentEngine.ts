import { extractEntities, normalizeNlpText } from "./entityExtractor";
import type { NlpIntent, NlpParseResult } from "../../types/nlp";

type IntentPattern = {
  intent: NlpIntent;
  patterns: RegExp[];
  weight?: number;
};

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "confirm",
    patterns: [
      /^(oui|ok|d'accord|daccord|confirme|vas-y|vas y|exact|correct)\.?$/,
      /^(oui,? (?:c'est|cest) (?:bon|ca|ça))\.?$/,
    ],
    weight: 100,
  },
  {
    intent: "cancel",
    patterns: [
      /^(non|annule|annuler|stop|laisse|laisse tomber|pas maintenant)\.?$/,
      /^(non,? merci)\.?$/,
    ],
    weight: 100,
  },
  {
    intent: "modify_vacation",
    patterns: [
      /\b(en )?vacances\b/,
      /\bconges\b/,
      /\bcongés\b/,
      /\bje suis en vacances\b/,
      /\bpériode de vacances\b/,
    ],
    weight: 90,
  },
  {
    intent: "modify_travel",
    patterns: [
      /\bdeplacement\b/,
      /\bdéplacement\b/,
      /\ben voyage\b/,
      /\bvoyage\b/,
      /\bwilliam est en deplacement\b/,
      /\bwilliam est en déplacement\b/,
      /\bwilliam.*voyage\b/,
      /\bje suis en deplacement\b/,
    ],
    weight: 85,
  },
  {
    intent: "declare_fatigue",
    patterns: [
      /\bfatigue\b.*\b(d[eé]cal\w*|report\w*)\b/u,
      /\b(d[eé]cal\w*|report\w*)\b.*\b(pas\s+)?(urgent|importante?s?)\b/u,
    ],
    weight: 92,
  },
  {
    intent: "declare_fatigue",
    patterns: [
      /\bfatigue\b/,
      /\bfatiguee\b/,
      /\bfatiguée\b/,
      /\bepuise\b/,
      /\bepuisee\b/,
      /\bepuisée\b/,
      /\bcrevee\b/,
      /\bcrée\b/,
      /\bje n'ai plus d'energie\b/,
    ],
    weight: 88,
  },
  {
    intent: "quiet_evening",
    patterns: [
      /\bsoiree tranquille\b/,
      /\bsoirée tranquille\b/,
      /\bsoiree calme\b/,
      /\bsoirée calme\b/,
      /\bsoir tranquille\b/,
      /\bsoir calme\b/,
    ],
    weight: 87,
  },
  {
    intent: "modify_sport",
    patterns: [
      /\bsupprime.*sport\b/,
      /\benleve.*sport\b/,
      /\benlève.*sport\b/,
      /\bretire.*sport\b/,
      /\bannule.*sport\b/,
    ],
    weight: 92,
  },
  {
    intent: "modify_calendar",
    patterns: [
      /\brendez[- ]?vous\b/,
      /\brdv\b/,
      /\bj'ai un rendez-vous\b/,
      /\bj ai un rendez-vous\b/,
      /\bconsultation\b/,
    ],
    weight: 83,
  },
  {
    intent: "modify_sport",
    patterns: [
      /\bcourir\b/,
      /\bcourse\b/,
      /\bsport\b/,
      /\bentrainement\b/,
      /\bentraînement\b/,
      /\bseance de sport\b/,
      /\bséance de sport\b/,
      /\bfooting\b/,
      /\bmusculation\b/,
      /\bmarche\b/,
    ],
    weight: 80,
  },
  {
    intent: "modify_spiritual",
    patterns: [
      /\bprier\b/,
      /\bpriere\b/,
      /\bprière\b/,
      /\bmoment spirituel\b/,
      /\btemps calme\b/,
      /\btemps de priere\b/,
      /\btemps de prière\b/,
      /\bspiritualite\b/,
      /\bspiritualité\b/,
    ],
    weight: 82,
  },
  {
    intent: "modify_study",
    patterns: [
      /\blire\b/,
      /\blecture\b/,
      /\breviser\b/,
      /\bréviser\b/,
      /\brevision\b/,
      /\brévision\b/,
      /\betude\b/,
      /\bétude\b/,
    ],
    weight: 78,
  },
  {
    intent: "modify_children",
    patterns: [
      /\benfants?\b/,
      /\bdort chez\b/,
      /\bchez mamie\b/,
      /\bchez papi\b/,
      /\benfant malade\b/,
      /\benfants malades\b/,
      /\bgarde\b/,
    ],
    weight: 84,
  },
  {
    intent: "modify_sleep",
    patterns: [
      /\bcoucher\b/,
      /\breveil\b/,
      /\bréveil\b/,
      /\bsommeil\b/,
      /\bdors\b/,
    ],
    weight: 75,
  },
  {
    intent: "modify_work",
    patterns: [
      /\bje travaille\b/,
      /\bje suis au travail\b/,
      /\bjour de travail\b/,
      /\bje finis.*plus tard\b/,
      /\bfinis.*plus tard\b/,
      /\bfinir.*plus tard\b/,
      /\bhoraires? de travail\b/,
      /\bje suis en repos\b/,
      /\bjour de repos\b/,
      /\bje ne travaille pas\b/,
      /\bpas de travail\b/,
    ],
    weight: 86,
  },
  {
    intent: "modify_tasks",
    patterns: [
      /\bsupprime\b/,
      /\bannule\b/,
      /\bretire\b/,
      /\benleve\b/,
      /\benlève\b/,
      /\btache\b/,
      /\btâche\b/,
      /\bpause\b/,
    ],
    weight: 70,
  },
  {
    intent: "request_suggestion",
    patterns: [
      /\bque me proposes-tu\b/,
      /\bque proposes-tu\b/,
      /\bquoi faire\b/,
      /\bune suggestion\b/,
      /\bpropose moi\b/,
      /\bpropose-moi\b/,
    ],
    weight: 65,
  },
  {
    intent: "ask_question",
    patterns: [
      /\bcomment\b/,
      /\bpourquoi\b/,
      /\bqu'est-ce que\b/,
      /\bquest ce que\b/,
      /\bexplique\b/,
      /\btype de journee\b/,
      /\btype de journée\b/,
    ],
    weight: 60,
  },
];

function scoreIntent(text: string, pattern: RegExp, weight = 1): number {
  return pattern.test(text) ? weight : 0;
}

export function detectIntent(text: string): {
  intent: NlpIntent;
  confidence: number;
} {
  const normalized = normalizeNlpText(text);
  let bestIntent: NlpIntent = "unknown";
  let bestScore = 0;

  for (const entry of INTENT_PATTERNS) {
    for (const pattern of entry.patterns) {
      const score = scoreIntent(normalized, pattern, entry.weight ?? 1);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = entry.intent;
      }
    }
  }

  if (bestScore === 0) {
    return { intent: "unknown", confidence: 0 };
  }

  return {
    intent: bestIntent,
    confidence: Math.min(1, bestScore / 100),
  };
}

export function parseUserMessage({
  text,
  referenceDate,
  childNames = [],
}: {
  text: string;
  referenceDate: string;
  childNames?: string[];
}): NlpParseResult {
  const { intent, confidence } = detectIntent(text);
  const entities = extractEntities({ text, referenceDate, childNames });

  return {
    intent,
    confidence,
    entities,
    rawText: text.trim(),
  };
}

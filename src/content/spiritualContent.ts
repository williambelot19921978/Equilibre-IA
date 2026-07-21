/**
 * Bibliothèque locale validée — Aura Sprint 2.8
 *
 * Versets bibliques : Louis Segond 1910 (domaine public).
 * Ne jamais inventer une référence ou un texte biblique.
 */

import type {
  PrayerCategory,
  RelaxationGuide,
  SpiritualContentItem,
} from "../types/spiritual";

export const BIBLE_VERSION = "Louis Segond 1910";

export const SPIRITUAL_CONTENT: SpiritualContentItem[] = [
  {
    id: "verse-phil-4-6-7",
    type: "verse",
    title: "Verset du jour",
    text: "Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ.",
    reference: "Philippiens 4:6-7",
    tags: ["paix", "soir"],
    contexts: ["evening", "fatigue", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    source: BIBLE_VERSION,
  },
  {
    id: "verse-ps-23-1",
    type: "verse",
    title: "Verset du jour",
    text: "L'Éternel est mon berger : je ne manquerai de rien.",
    reference: "Psaume 23:1",
    tags: ["confiance", "repos"],
    contexts: ["any", "fatigue"],
    durationMinutes: 3,
    faithLevel: "christian",
    source: BIBLE_VERSION,
  },
  {
    id: "verse-mt-11-28",
    type: "verse",
    title: "Verset du jour",
    text: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.",
    reference: "Matthieu 11:28",
    tags: ["repos", "fatigue"],
    contexts: ["fatigue", "evening", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    source: BIBLE_VERSION,
  },
  {
    id: "verse-2co-12-9",
    type: "verse",
    title: "Verset du jour",
    text: "Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse.",
    reference: "2 Corinthiens 12:9",
    tags: ["encouragement", "fatigue"],
    contexts: ["fatigue", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    source: BIBLE_VERSION,
  },
  {
    id: "verse-ps-46-11",
    type: "verse",
    title: "Verset du jour",
    text: "Arrêtez, et sachez que je suis Dieu.",
    reference: "Psaume 46:11",
    tags: ["calme", "silence"],
    contexts: ["evening", "any"],
    durationMinutes: 3,
    faithLevel: "christian",
    source: BIBLE_VERSION,
  },
  {
    id: "verse-pr-3-5-6",
    type: "verse",
    title: "Verset du jour",
    text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.",
    reference: "Proverbes 3:5-6",
    tags: ["confiance", "matin"],
    contexts: ["morning", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    source: BIBLE_VERSION,
  },
  {
    id: "mot-neutral-1",
    type: "motivation",
    title: "Une parole pour aujourd'hui",
    text: "Tu n'as pas besoin de tout accomplir aujourd'hui pour avancer.",
    tags: ["repos", "famille"],
    contexts: ["any", "fatigue"],
    durationMinutes: 2,
    faithLevel: "neutral",
  },
  {
    id: "mot-neutral-2",
    type: "motivation",
    title: "Une parole pour aujourd'hui",
    text: "Un pas simple, bien posé, suffit pour cette journée.",
    tags: ["encouragement"],
    contexts: ["any"],
    durationMinutes: 2,
    faithLevel: "neutral",
  },
  {
    id: "mot-neutral-3",
    type: "motivation",
    title: "Une parole pour aujourd'hui",
    text: "Prendre soin de toi fait aussi partie de prendre soin de ta famille.",
    tags: ["famille", "repos"],
    contexts: ["family", "any"],
    durationMinutes: 2,
    faithLevel: "neutral",
  },
  {
    id: "enc-ch-1",
    type: "encouragement",
    title: "Encouragement",
    text: "Tu n'as pas à tout porter seule aujourd'hui. Un pas simple suffit.",
    tags: ["famille"],
    contexts: ["any", "fatigue", "family"],
    durationMinutes: 3,
    faithLevel: "christian",
  },
  {
    id: "enc-ch-2",
    type: "encouragement",
    title: "Encouragement",
    text: "Dieu voit tes efforts, même ceux que personne ne remarque.",
    tags: ["courage"],
    contexts: ["any", "work"],
    durationMinutes: 3,
    faithLevel: "christian",
  },
  {
    id: "grat-1",
    type: "gratitude",
    title: "Gratitude",
    text: "Note trois petites choses pour lesquelles tu es reconnaissante aujourd'hui.",
    tags: ["gratitude"],
    contexts: ["evening", "any"],
    durationMinutes: 5,
    faithLevel: "neutral",
  },
  {
    id: "grat-2",
    type: "gratitude",
    title: "Gratitude",
    text: "Remercie pour une personne, un moment simple et une grâce reçue aujourd'hui.",
    tags: ["gratitude"],
    contexts: ["evening", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
  },
  {
    id: "refl-evening-1",
    type: "reflection",
    title: "Réflexion du soir",
    text: "Qu'est-ce qui t'a donné de la paix aujourd'hui ? Qu'aimerais-tu confier avant de dormir ?",
    tags: ["soir", "réflexion"],
    contexts: ["evening"],
    durationMinutes: 10,
    faithLevel: "christian",
  },
  {
    id: "refl-patience",
    type: "reflection",
    title: "Réflexion",
    text: "Où as-tu eu besoin de patience aujourd'hui ? Comment peux-tu te montrer clément envers toi-même ?",
    tags: ["patience", "famille"],
    contexts: ["evening", "family"],
    durationMinutes: 10,
    faithLevel: "neutral",
  },
  {
    id: "calm-1",
    type: "calm_invitation",
    title: "Invitation au calme",
    text: "Accorde-toi quelques minutes sans écran. Respire lentement et laisse ton corps se détendre.",
    tags: ["calme", "silence"],
    contexts: ["evening", "fatigue", "any"],
    durationMinutes: 5,
    faithLevel: "neutral",
  },
  {
    id: "calm-2",
    type: "calm_invitation",
    title: "Invitation au calme",
    text: "Un moment de silence peut suffire à retrouver un peu de clarté.",
    tags: ["silence"],
    contexts: ["any", "fatigue"],
    durationMinutes: 5,
    faithLevel: "neutral",
  },
  {
    id: "prayer-morning",
    type: "prayer",
    title: "Prière du matin",
    text: "Seigneur, merci pour cette nouvelle journée. Guide mes pas, mes paroles et mon cœur.",
    reference: "Prière du matin",
    tags: ["matin"],
    contexts: ["morning"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "morning",
  },
  {
    id: "prayer-evening",
    type: "prayer",
    title: "Prière du soir",
    text: "Seigneur, merci pour cette journée. Accorde-moi un repos paisible et une confiance renouvelée.",
    reference: "Prière du soir",
    tags: ["soir"],
    contexts: ["evening"],
    durationMinutes: 10,
    faithLevel: "christian",
    prayerCategory: "evening",
  },
  {
    id: "prayer-gratitude",
    type: "prayer",
    title: "Prière de gratitude",
    text: "Merci, Seigneur, pour les grâces reçues aujourd'hui, même les plus discrètes.",
    reference: "Gratitude",
    tags: ["gratitude"],
    contexts: ["evening", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "gratitude",
  },
  {
    id: "prayer-courage",
    type: "prayer",
    title: "Prière pour le courage",
    text: "Seigneur, quand je me sens faible, rappelle-moi que ta grâce me suffit.",
    reference: "Courage",
    tags: ["courage"],
    contexts: ["any", "work"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "courage",
  },
  {
    id: "prayer-fatigue",
    type: "prayer",
    title: "Prière dans la fatigue",
    text: "Seigneur, je suis fatiguée. Accorde-moi du repos et de la douceur envers moi-même.",
    reference: "Fatigue",
    tags: ["fatigue"],
    contexts: ["fatigue", "evening"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "fatigue",
  },
  {
    id: "prayer-family",
    type: "prayer",
    title: "Prière pour la famille",
    text: "Seigneur, bénis ma famille. Donne-nous patience, tendresse et paix sous notre toit.",
    reference: "Famille",
    tags: ["famille"],
    contexts: ["family", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "family",
  },
  {
    id: "prayer-children",
    type: "prayer",
    title: "Prière pour les enfants",
    text: "Seigneur, protège mes enfants. Donne-moi sagesse et douceur pour les accompagner.",
    reference: "Enfants",
    tags: ["enfants"],
    contexts: ["family"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "children",
  },
  {
    id: "prayer-work",
    type: "prayer",
    title: "Prière pour le travail",
    text: "Seigneur, bénis mon travail aujourd'hui. Donne-moi clarté, intégrité et sérénité.",
    reference: "Travail",
    tags: ["travail"],
    contexts: ["work", "morning"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "work",
  },
  {
    id: "prayer-studies",
    type: "prayer",
    title: "Prière pour les études",
    text: "Seigneur, aide-moi à apprendre avec persévérance et confiance.",
    reference: "Études",
    tags: ["études"],
    contexts: ["any"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "studies",
  },
  {
    id: "prayer-peace",
    type: "prayer",
    title: "Prière pour la paix",
    text: "Seigneur, apaise mon cœur. Donne-moi ta paix qui surpasse toute intelligence.",
    reference: "Paix",
    tags: ["paix"],
    contexts: ["evening", "any"],
    durationMinutes: 5,
    faithLevel: "christian",
    prayerCategory: "peace",
  },
  {
    id: "prayer-difficulty",
    type: "prayer",
    title: "Prière dans la difficulté",
    text: "Seigneur, tu connais ce que je traverse. Tiens-moi près de toi et ne me laisse pas seule.",
    reference: "Difficulté",
    tags: ["difficulté"],
    contexts: ["any", "fatigue"],
    durationMinutes: 10,
    faithLevel: "christian",
    prayerCategory: "difficulty",
  },
];

export const RELAXATION_GUIDES: RelaxationGuide[] = [
  {
    id: "breath-2",
    title: "Respiration — 2 minutes",
    durationMinutes: 2,
    steps: [
      "Pose le téléphone ou appuie-toi confortablement.",
      "Inspire lentement par le nez pendant 4 secondes.",
      "Expire doucement par la bouche pendant 6 secondes.",
      "Répète ce rythme pendant 2 minutes, sans te presser.",
    ],
    tags: ["respiration", "court"],
    faithLevel: "neutral",
  },
  {
    id: "breath-5",
    title: "Respiration — 5 minutes",
    durationMinutes: 5,
    steps: [
      "Assieds-toi ou allonge-toi confortablement.",
      "Inspire par le nez pendant 4 secondes.",
      "Retiens l'air 2 secondes.",
      "Expire par la bouche pendant 6 secondes.",
      "Répète ce cycle pendant 5 minutes.",
    ],
    tags: ["respiration"],
    faithLevel: "neutral",
  },
  {
    id: "silence-5",
    title: "Silence — 5 minutes",
    durationMinutes: 5,
    steps: [
      "Coupe les notifications si possible.",
      "Ferme les yeux ou fixe un point calme.",
      "Laisse passer les pensées sans les juger.",
      "Reste simplement présente pendant 5 minutes.",
    ],
    tags: ["silence"],
    faithLevel: "neutral",
  },
  {
    id: "muscle-short",
    title: "Relaxation musculaire courte",
    durationMinutes: 5,
    steps: [
      "Commence par les épaules : serre 5 secondes, puis relâche.",
      "Poursuis avec les mains, puis le visage.",
      "Termine par les jambes, une à une.",
      "Respire lentement entre chaque groupe musculaire.",
    ],
    tags: ["relaxation"],
    faithLevel: "neutral",
  },
  {
    id: "gratitude-guide",
    title: "Gratitude — 5 minutes",
    durationMinutes: 5,
    steps: [
      "Pense à une personne qui t'a soutenue récemment.",
      "Note un moment simple qui t'a fait du bien.",
      "Remercie intérieurement pour une grâce reçue.",
    ],
    tags: ["gratitude"],
    faithLevel: "neutral",
  },
  {
    id: "walk-calm",
    title: "Marche calme — 10 minutes",
    durationMinutes: 10,
    steps: [
      "Sors si possible, ou marche lentement chez toi.",
      "Synchronise tes pas avec une respiration lente.",
      "Observe autour de toi sans te presser.",
      "Reviens quand tu te sens un peu plus apaisée.",
    ],
    tags: ["marche"],
    faithLevel: "neutral",
  },
  {
    id: "prayer-guided",
    title: "Prière guidée écrite",
    durationMinutes: 10,
    steps: [
      "Commence par un moment de silence (30 secondes).",
      "Remercie pour trois choses de cette journée.",
      "Confie ce qui pèse sur ton cœur.",
      "Termine par : « Seigneur, je te confie cette journée. »",
    ],
    tags: ["prière"],
    faithLevel: "christian",
  },
  {
    id: "screen-free",
    title: "Temps sans écran — 15 minutes",
    durationMinutes: 15,
    steps: [
      "Pose le téléphone hors de portée.",
      "Choisis une activité calme : thé, fenêtre ouverte, étirement doux.",
      "Reste présente sans multitâche pendant 15 minutes.",
    ],
    tags: ["sans écran"],
    faithLevel: "neutral",
  },
];

const PREFERENCE_TYPE_MAP: Record<string, SpiritualContentItem["type"]> = {
  verse: "verse",
  prayer: "prayer",
  gratitude: "gratitude",
  encouragement: "encouragement",
  evening_reflection: "reflection",
  reflection: "reflection",
};

export function mapPreferenceToContentType(
  preference: string,
): SpiritualContentItem["type"] | null {
  return PREFERENCE_TYPE_MAP[preference] ?? null;
}

export function getContentById(id: string): SpiritualContentItem | undefined {
  return SPIRITUAL_CONTENT.find((item) => item.id === id);
}

export function getRelaxationById(id: string): RelaxationGuide | undefined {
  return RELAXATION_GUIDES.find((item) => item.id === id);
}

export function filterContentByFaith(
  items: SpiritualContentItem[],
  faithImportance?: string,
): SpiritualContentItem[] {
  if (!faithImportance || faithImportance === "disabled") {
    return items.filter((item) => item.faithLevel === "neutral");
  }
  return items;
}

export function pickSpiritualContentItem({
  preferences = [],
  recentIds = [],
  faithImportance,
  types,
  contexts,
  prayerCategory,
}: {
  preferences?: string[];
  recentIds?: string[];
  faithImportance?: string;
  types?: SpiritualContentItem["type"][];
  contexts?: SpiritualContentItem["contexts"][number][];
  prayerCategory?: PrayerCategory;
}): SpiritualContentItem {
  const allowed = filterContentByFaith(SPIRITUAL_CONTENT, faithImportance);

  const preferredTypes = new Set(
    preferences
      .map(mapPreferenceToContentType)
      .filter(Boolean) as SpiritualContentItem["type"][],
  );

  let candidates = allowed.filter((item) => {
    if (recentIds.includes(item.id)) return false;
    if (types && !types.includes(item.type)) return false;
    if (prayerCategory && item.prayerCategory !== prayerCategory) return false;
    if (contexts && !contexts.some((ctx) => item.contexts.includes(ctx))) {
      return false;
    }
    if (preferredTypes.size > 0 && !preferredTypes.has(item.type)) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    candidates = allowed.filter((item) => !recentIds.includes(item.id));
  }

  if (candidates.length === 0) {
    candidates = allowed;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickRelaxationGuide({
  recentIds = [],
  faithImportance,
  maxDuration,
}: {
  recentIds?: string[];
  faithImportance?: string;
  maxDuration?: number;
}): RelaxationGuide {
  const allowChristian = faithImportance && faithImportance !== "disabled";

  let pool = RELAXATION_GUIDES.filter((guide) => {
    if (recentIds.includes(guide.id)) return false;
    if (!allowChristian && guide.faithLevel === "christian") return false;
    if (maxDuration && guide.durationMinutes > maxDuration) return false;
    return true;
  });

  if (pool.length === 0) {
    pool = RELAXATION_GUIDES.filter(
      (guide) => allowChristian || guide.faithLevel === "neutral",
    );
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPrayersByCategory(
  category: PrayerCategory,
  faithImportance?: string,
): SpiritualContentItem[] {
  return filterContentByFaith(SPIRITUAL_CONTENT, faithImportance).filter(
    (item) => item.type === "prayer" && item.prayerCategory === category,
  );
}

/** Compatibilité Sprint 2.3–2.5 */
export function toLegacySpiritualItem(item: SpiritualContentItem): {
  id: string;
  type: "verse" | "encouragement" | "prayer" | "gratitude" | "reflection";
  reference: string;
  text: string;
} {
  const legacyType =
    item.type === "motivation" || item.type === "calm_invitation"
      ? "encouragement"
      : item.type;

  return {
    id: item.id,
    type: legacyType,
    reference: item.reference ?? item.title ?? item.type,
    text: item.text,
  };
}

export const SPIRITUAL_CONTENT_LIBRARY = SPIRITUAL_CONTENT.map(toLegacySpiritualItem);

export function pickSpiritualContent(args: {
  preferences: string[];
  recentIds?: string[];
}): ReturnType<typeof toLegacySpiritualItem> {
  return toLegacySpiritualItem(
    pickSpiritualContentItem({
      preferences: args.preferences,
      recentIds: args.recentIds,
    }),
  );
}

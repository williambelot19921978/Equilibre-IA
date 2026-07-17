/**
 * Calendrier catholique français — saints fixes et fêtes liturgiques mobiles.
 *
 * Source de référence :
 * - Calendrier liturgique romain général (édition française)
 * - Saints traditionnels du calendrier français (prénoms)
 * - Calcul des fêtes mobiles : algorithme de Computus (Pâques grégorienne)
 *
 * Année de référence documentée : 2026
 * Locale : fr-FR
 *
 * Note : le calendrier civil des prénoms et le calendrier liturgique
 * ne coïncident pas toujours — les deux sont distingués dans CatholicDayInfo.
 */

export type CatholicDayRank = "solemnity" | "feast" | "memorial" | "optional";

export type CatholicDayInfo = {
  date: string;
  saintName?: string;
  liturgicalCelebration?: string;
  rank?: CatholicDayRank;
  shortDescription?: string;
  source: string;
  locale: string;
};

export const CATHOLIC_CALENDAR_SOURCE =
  "Calendrier liturgique romain général (FR) + saints traditionnels français — réf. 2026";

const LOCALE = "fr-FR";

/** Saints fixes (MM-DD → saint du calendrier traditionnel français). */
const FIXED_SAINTS: Record<string, { name: string; description?: string }> = {
  "01-01": { name: "Marie, Mère de Dieu", description: "Solennité du 1er janvier." },
  "01-06": { name: "Épiphanie", description: "Manifestation du Seigneur aux nations." },
  "01-17": { name: "Antoine", description: "Saint Antoine, ermite du désert." },
  "01-25": { name: "Conversion de saint Paul", description: "Apôtre des nations." },
  "02-02": { name: "Présentation au Temple", description: "Chandeleur — rencontre de Jésus au Temple." },
  "02-14": { name: "Valentin", description: "Saint Valentin, patron des amoureux." },
  "03-19": { name: "Joseph", description: "Saint Joseph, époux de la Vierge Marie." },
  "04-23": { name: "Georges", description: "Saint Georges, martyr." },
  "05-01": { name: "Joseph artisan", description: "Saint Joseph, travailleur." },
  "06-24": { name: "Jean-Baptiste", description: "Naissance de saint Jean-Baptiste." },
  "06-29": { name: "Pierre et Paul", description: "Apôtres fondateurs de l'Église de Rome." },
  "07-11": { name: "Benoît", description: "Saint Benoît, père du monachisme occidental." },
  "07-14": { name: "Camille de Lellis", description: "Saint Camille, fondateur des Camilliens." },
  "07-16": { name: "Notre-Dame du Mont-Carmel", description: "Mémoire de la Vierge du Carmel." },
  "07-22": { name: "Marie-Madeleine", description: "Sainte Marie-Madeleine, disciple du Christ." },
  "07-25": { name: "Jacques", description: "Saint Jacques, apôtre." },
  "07-26": { name: "Anne et Joachim", description: "Parents de la Vierge Marie." },
  "08-04": { name: "Jean-Marie Vianney", description: "Curé d'Ars, patron des prêtres." },
  "08-15": {
    name: "Assomption",
    description: "Assomption de la Vierge Marie — grande fête liturgique.",
  },
  "08-22": { name: "Reine du Monde", description: "Fête de Marie Reine." },
  "09-08": { name: "Nativité de Marie", description: "Naissance de la Vierge Marie." },
  "09-14": { name: "Exaltation de la Sainte-Croix", description: "Fête de la Croix glorieuse." },
  "09-29": { name: "Michel, Gabriel et Raphaël", description: "Archanges." },
  "10-01": { name: "Thérèse de l'Enfant-Jésus", description: "Sainte Thérèse de Lisieux." },
  "10-04": { name: "François d'Assise", description: "Saint François, patron de l'écologie." },
  "10-07": { name: "Notre-Dame du Rosaire", description: "Fête du Rosaire." },
  "11-01": {
    name: "Toussaint",
    description: "Commémoration de tous les saints — fête liturgique.",
  },
  "11-02": { name: "Défunts", description: "Commémoration des fidèles défunts." },
  "11-11": { name: "Martin", description: "Saint Martin de Tours." },
  "11-21": { name: "Présentation de Marie", description: "Présentation de la Vierge au Temple." },
  "12-06": { name: "Nicolas", description: "Saint Nicolas, évêque de Myre." },
  "12-08": { name: "Immaculée Conception", description: "Conception sans péché de Marie." },
  "12-25": {
    name: "Nativité du Seigneur",
    description: "Noël — naissance de Jésus-Christ.",
  },
  "12-26": { name: "Étienne", description: "Premier martyr chrétien." },
  "12-27": { name: "Jean", description: "Saint Jean, apôtre et évangéliste." },
};

/** Calcul de Pâques (algorithme de Meeus/Jones/Butcher). */
export function computeEasterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type MobileFeast = {
  offsetFromEaster: number;
  liturgicalCelebration: string;
  rank: CatholicDayRank;
  shortDescription: string;
};

const MOBILE_FEASTS: MobileFeast[] = [
  {
    offsetFromEaster: -46,
    liturgicalCelebration: "Mercredi des Cendres",
    rank: "feast",
    shortDescription: "Entrée dans le temps de Carême.",
  },
  {
    offsetFromEaster: -2,
    liturgicalCelebration: "Vendredi Saint",
    rank: "solemnity",
    shortDescription: "Passion et mort du Seigneur.",
  },
  {
    offsetFromEaster: -1,
    liturgicalCelebration: "Samedi Saint",
    rank: "feast",
    shortDescription: "Veille pascale — attente de la Résurrection.",
  },
  {
    offsetFromEaster: 0,
    liturgicalCelebration: "Pâques",
    rank: "solemnity",
    shortDescription: "Résurrection du Seigneur — fête centrale de la foi chrétienne.",
  },
  {
    offsetFromEaster: 39,
    liturgicalCelebration: "Ascension",
    rank: "solemnity",
    shortDescription: "Montée du Christ au ciel, quarante jours après Pâques.",
  },
  {
    offsetFromEaster: 49,
    liturgicalCelebration: "Pentecôte",
    rank: "solemnity",
    shortDescription: "Descente de l'Esprit Saint sur les apôtres.",
  },
  {
    offsetFromEaster: 60,
    liturgicalCelebration: "Fête-Dieu",
    rank: "solemnity",
    shortDescription: "Corpus Christi — fête de l'Eucharistie.",
  },
];

function getMobileFeastForDate(date: string): CatholicDayInfo | null {
  const year = Number(date.slice(0, 4));
  const easter = computeEasterSunday(year);

  for (const feast of MOBILE_FEASTS) {
    const feastDate = addDays(easter, feast.offsetFromEaster);
    if (feastDate === date) {
      return {
        date,
        liturgicalCelebration: feast.liturgicalCelebration,
        rank: feast.rank,
        shortDescription: feast.shortDescription,
        source: CATHOLIC_CALENDAR_SOURCE,
        locale: LOCALE,
      };
    }
  }

  return null;
}

function getFixedSaintForDate(date: string): CatholicDayInfo | null {
  const key = date.slice(5);
  const entry = FIXED_SAINTS[key];
  if (!entry) return null;

  const isLiturgical =
    key === "08-15" || key === "11-01" || key === "12-25" || key === "01-01";

  return {
    date,
    saintName: isLiturgical ? undefined : entry.name,
    liturgicalCelebration: isLiturgical ? entry.name : undefined,
    rank: isLiturgical ? "solemnity" : "memorial",
    shortDescription: entry.description,
    source: CATHOLIC_CALENDAR_SOURCE,
    locale: LOCALE,
  };
}

/** Retourne les informations catholiques pour une date (fuseau local de l'appareil). */
export function getCatholicDayInfo(date: string): CatholicDayInfo | null {
  const mobile = getMobileFeastForDate(date);
  if (mobile) return mobile;

  return getFixedSaintForDate(date);
}

/** Libellé court pour affichage discret sous la phrase motivation. */
export function formatCatholicDayLine(info: CatholicDayInfo): string {
  if (info.liturgicalCelebration) {
    return `Fête liturgique : ${info.liturgicalCelebration}`;
  }
  if (info.saintName) {
    const name = info.saintName.startsWith("saint") || info.saintName.startsWith("Sainte")
      ? info.saintName
      : `saint ${info.saintName}`;
    return `Saint du jour : ${name}`;
  }
  return "";
}

/**
 * EPIC 5C — Test fixtures & life profiles.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import { item } from "../../planningCalendarEngine/testing/fixtures";
import type { LifeProfileKind } from "../types/semanticTypes";

export const ITEM_DENTIST = item({
  id: "evt-dentist",
  title: "Dentiste — contrôle",
  start: "2026-07-20T14:00:00.000Z",
  end: "2026-07-20T15:00:00.000Z",
  type: "appointment",
});

export const ITEM_SPRINT = item({
  id: "evt-sprint",
  title: "Réunion Sprint",
  start: "2026-07-20T09:00:00.000Z",
  end: "2026-07-20T10:00:00.000Z",
  type: "appointment",
});

export const ITEM_GYM = item({
  id: "evt-gym",
  title: "Basic Fit — musculation",
  start: "2026-07-20T18:00:00.000Z",
  end: "2026-07-20T19:00:00.000Z",
  type: "event",
});

export const ITEM_BIRTHDAY = item({
  id: "evt-birthday",
  title: "Anniversaire de Léa",
  start: "2026-07-20T17:00:00.000Z",
  end: "2026-07-20T19:00:00.000Z",
  type: "event",
});

export const ITEM_TRAVEL = item({
  id: "evt-travel",
  title: "Voyage Montréal",
  start: "2026-07-21T08:00:00.000Z",
  end: "2026-07-21T12:00:00.000Z",
  type: "event",
  location: "Gare",
});

export const ITEM_STUDY = item({
  id: "evt-study",
  title: "Révision examen",
  start: "2026-07-20T20:00:00.000Z",
  end: "2026-07-20T22:00:00.000Z",
  type: "task",
});

export const ITEM_PERSONAL = item({
  id: "evt-personal",
  title: "Lecture perso",
  start: "2026-07-20T21:00:00.000Z",
  end: "2026-07-20T22:00:00.000Z",
  type: "event",
});

export type LifeProfileFixture = {
  readonly kind: LifeProfileKind;
  readonly label: string;
  readonly items: readonly CalendarItem[];
  readonly childrenCount: number;
  readonly memberCount: number;
  readonly goals: readonly { id: string; name: string }[];
};

export const PROFILE_CELIBATAIRE: LifeProfileFixture = {
  kind: "celibataire",
  label: "Célibataire actif",
  items: [ITEM_SPRINT, ITEM_GYM, ITEM_PERSONAL],
  childrenCount: 0,
  memberCount: 1,
  goals: [{ id: "g1", name: "Objectif Sport" }],
};

export const PROFILE_COUPLE: LifeProfileFixture = {
  kind: "couple",
  label: "Couple sans enfant",
  items: [ITEM_SPRINT, ITEM_BIRTHDAY, ITEM_PERSONAL],
  childrenCount: 0,
  memberCount: 2,
  goals: [{ id: "g2", name: "Objectif Famille" }],
};

export const PROFILE_FAMILLE: LifeProfileFixture = {
  kind: "famille",
  label: "Famille avec enfants",
  items: [ITEM_SPRINT, ITEM_BIRTHDAY, ITEM_DENTIST, ITEM_GYM],
  childrenCount: 2,
  memberCount: 4,
  goals: [
    { id: "g3", name: "Objectif Santé" },
    { id: "g4", name: "Objectif Famille" },
  ],
};

export const PROFILE_ETUDIANT: LifeProfileFixture = {
  kind: "etudiant",
  label: "Étudiant",
  items: [ITEM_STUDY, ITEM_SPRINT, ITEM_PERSONAL],
  childrenCount: 0,
  memberCount: 1,
  goals: [{ id: "g5", name: "Objectif Études" }],
};

export const PROFILE_TRAVAILLEUR_POSTE: LifeProfileFixture = {
  kind: "travailleur_poste",
  label: "Travailleur posté",
  items: [
    item({
      id: "evt-night",
      title: "Quart de nuit",
      start: "2026-07-20T22:00:00.000Z",
      end: "2026-07-21T06:00:00.000Z",
      type: "event",
    }),
    ITEM_GYM,
  ],
  childrenCount: 0,
  memberCount: 1,
  goals: [],
};

export const PROFILE_INDEPENDANT: LifeProfileFixture = {
  kind: "independant",
  label: "Travailleur indépendant",
  items: [ITEM_SPRINT, ITEM_TRAVEL, ITEM_DENTIST, ITEM_GYM, ITEM_STUDY],
  childrenCount: 0,
  memberCount: 1,
  goals: [
    { id: "g6", name: "Objectif Marathon" },
    { id: "g7", name: "Objectif Santé" },
  ],
};

export const ALL_PROFILES: readonly LifeProfileFixture[] = [
  PROFILE_CELIBATAIRE,
  PROFILE_COUPLE,
  PROFILE_FAMILLE,
  PROFILE_ETUDIANT,
  PROFILE_TRAVAILLEUR_POSTE,
  PROFILE_INDEPENDANT,
];

export const DAY_START = "2026-07-20T00:00:00.000Z";
export const DAY_END = "2026-07-20T23:59:59.999Z";

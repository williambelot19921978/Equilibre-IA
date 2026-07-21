/**
 * EPIC 8A — Trust Center types.
 */

export type PrivacyPreferenceKey =
  | "useHistory"
  | "learnHabits"
  | "useCheckins"
  | "personalizedAdvice"
  | "shareAnalytics";

export type PrivacyPreferences = Record<PrivacyPreferenceKey, boolean>;

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  useHistory: true,
  learnHabits: true,
  useCheckins: true,
  personalizedAdvice: true,
  shareAnalytics: true,
};

export type TrustDashboardSnapshot = {
  readonly dataCategoriesUsedToday: readonly string[];
  readonly lastCheckinAt: string | null;
  readonly lastSyncAt: string | null;
  readonly knowledgeCount: number;
  readonly recommendationsCount: number;
  readonly lastBackupAt: string | null;
  readonly generatedAt: string;
};

export type SecuritySnapshot = {
  readonly email: string | null;
  readonly lastSignInAt: string | null;
  readonly sessionExpiresAt: string | null;
  readonly currentDeviceLabel: string;
  readonly isSessionFresh: boolean;
};

export type DataExportSection =
  | "profile"
  | "goals"
  | "history"
  | "checkins"
  | "habits"
  | "preferences";

export type UserDataExportBundle = {
  readonly exportedAt: string;
  readonly userId: string;
  readonly sections: DataExportSection[];
  readonly profile: Record<string, unknown>;
  readonly goals: unknown[];
  readonly checkins: unknown[];
  readonly habits: Record<string, unknown>;
  readonly preferences: Record<string, unknown>;
  readonly lifeKnowledge: Record<string, unknown>;
  readonly history: Record<string, unknown>;
};

export type DataDeletionScope =
  | "habits"
  | "checkins"
  | "goals"
  | "auraMemory"
  | "all";

export type FeedbackKind = "opinion" | "problem" | "idea" | "rating";

export type FeedbackEntry = {
  readonly id: string;
  readonly kind: FeedbackKind;
  readonly message: string;
  readonly rating?: number;
  readonly context?: string;
  readonly createdAt: string;
};

export type RecommendationWhyDetails = {
  readonly dataUsed: readonly string[];
  readonly why: readonly string[];
  readonly goalName?: string;
  readonly confidenceLabel: string;
  readonly canIgnore: boolean;
  readonly onIgnore?: () => void;
};

export const FAQ_ITEMS = [
  {
    id: "why-question",
    question: "Pourquoi Aura me pose cette question ?",
    answer:
      "Aura ne pose une question que si la réponse améliore une suggestion concrète. Vous pouvez toujours passer ou modifier plus tard dans Confiance & Confidentialité.",
  },
  {
    id: "why-checkin",
    question: "Pourquoi un check-in ?",
    answer:
      "Le check-in indique comment vous vous sentez aujourd'hui. Aura l'utilise uniquement si vous l'autorisez, pour adapter le rythme — jamais pour juger.",
  },
  {
    id: "disable-ai",
    question: "Puis-je désactiver l'IA ?",
    answer:
      "Oui. Dans Confiance & Confidentialité, désactivez les conseils personnalisés ou l'apprentissage des habitudes. Aura reste utilisable sans suggestions IA.",
  },
  {
    id: "delete-data",
    question: "Puis-je supprimer mes données ?",
    answer:
      "Oui. Exportez d'abord si vous le souhaitez, puis choisissez une suppression partielle ou totale. Une confirmation est toujours demandée.",
  },
  {
    id: "coach",
    question: "Comment fonctionne le coach ?",
    answer:
      "Le coach propose des pistes basées sur vos objectifs et votre ressenti. Il ne décide jamais à votre place — chaque conseil est expliquable via « Pourquoi ? ».",
  },
] as const;

export type CalendarColorCategory =
  | "work"
  | "appointment"
  | "children"
  | "vacation"
  | "sport"
  | "study"
  | "rest"
  | "spiritual"
  | "family"
  | "commute"
  | "personal"
  | "free"
  | "birthday"
  | "google";

export type CalendarColorStyle = {
  category: CalendarColorCategory;
  label: string;
  background: string;
  text: string;
  border: string;
  dot: string;
  icon?: string;
};

export const CALENDAR_COLORS: Record<CalendarColorCategory, CalendarColorStyle> = {
  work: {
    category: "work",
    label: "Travail",
    background: "#dce8f8",
    text: "#0f2d4f",
    border: "#1e4a7a",
    dot: "#1e4a7a",
    icon: "💼",
  },
  appointment: {
    category: "appointment",
    label: "Rendez-vous",
    background: "#fdeee8",
    text: "#7a2e1f",
    border: "#d45d45",
    dot: "#d45d45",
    icon: "📅",
  },
  children: {
    category: "children",
    label: "Enfants / école",
    background: "#fff4e0",
    text: "#7a4f10",
    border: "#d4a017",
    dot: "#d4a017",
    icon: "👶",
  },
  vacation: {
    category: "vacation",
    label: "Vacances",
    background: "#d4f5ec",
    text: "#0d4f3f",
    border: "#1a9e7a",
    dot: "#1a9e7a",
    icon: "🏖️",
  },
  sport: {
    category: "sport",
    label: "Sport",
    background: "#f0e8fa",
    text: "#4a2d6e",
    border: "#7c5cbf",
    dot: "#7c5cbf",
    icon: "🏃",
  },
  study: {
    category: "study",
    label: "Études",
    background: "#ece8fa",
    text: "#2e2d6e",
    border: "#5c5cbf",
    dot: "#5c5cbf",
    icon: "📚",
  },
  rest: {
    category: "rest",
    label: "Repos",
    background: "#eef6ff",
    text: "#2a4f6e",
    border: "#7eb8e8",
    dot: "#7eb8e8",
    icon: "🛋️",
  },
  spiritual: {
    category: "spiritual",
    label: "Spiritualité",
    background: "#faf5e8",
    text: "#6b5a2e",
    border: "#c9a84c",
    dot: "#c9a84c",
    icon: "✨",
  },
  family: {
    category: "family",
    label: "Famille",
    background: "#e8f7ed",
    text: "#2d5f3a",
    border: "#5cbf7c",
    dot: "#5cbf7c",
    icon: "👨‍👩‍👧",
  },
  commute: {
    category: "commute",
    label: "Déplacement",
    background: "#f3ebe3",
    text: "#5a3a1a",
    border: "#b87830",
    dot: "#b87830",
    icon: "🚗",
  },
  personal: {
    category: "personal",
    label: "Tâche personnelle",
    background: "#fae8f4",
    text: "#6e2d5a",
    border: "#bf5c9e",
    dot: "#bf5c9e",
    icon: "📝",
  },
  free: {
    category: "free",
    label: "Temps libre",
    background: "#f4f4f4",
    text: "#5a5a5a",
    border: "#c8c8c8",
    dot: "#c8c8c8",
    icon: "🕊️",
  },
  birthday: {
    category: "birthday",
    label: "Anniversaire",
    background: "#fdf0f8",
    text: "#7a2d5a",
    border: "#d45c9e",
    dot: "#d45c9e",
    icon: "🎂",
  },
  google: {
    category: "google",
    label: "Google Calendar",
    background: "#eef4ff",
    text: "#1a3d7a",
    border: "#4285f4",
    dot: "#4285f4",
    icon: "📆",
  },
};

export const CALENDAR_LEGEND_ITEMS: CalendarColorCategory[] = [
  "work",
  "appointment",
  "children",
  "vacation",
  "sport",
  "study",
  "rest",
  "spiritual",
  "family",
  "commute",
  "personal",
  "free",
  "birthday",
  "google",
];

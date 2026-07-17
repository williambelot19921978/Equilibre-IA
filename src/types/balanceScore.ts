export type BalanceCategory =
  | "sport"
  | "sleep"
  | "study"
  | "family"
  | "couple"
  | "spiritual"
  | "rest"
  | "admin"
  | "leisure";

export type BalanceCategoryScore = {
  category: BalanceCategory;
  label: string;
  score: number;
  summary: string;
};

export type BalanceScore = {
  globalScore: number;
  categories: BalanceCategoryScore[];
  computedAt: string;
};

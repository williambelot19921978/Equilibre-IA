export type FlexibleBufferPreferredUse =
  | "free_time"
  | "recovery"
  | "sport"
  | "flexible";

export type FlexibleBuffer = {
  id: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  absorbable: boolean;
  minimumRemainingMinutes: number;
  preferredUse: FlexibleBufferPreferredUse;
  source: "computed" | "margin" | "engine";
};

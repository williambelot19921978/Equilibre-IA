export type WorkExceptionType =
  | "no_work_morning"
  | "no_work_afternoon"
  | "work_morning_only"
  | "work_afternoon_only"
  | "no_work_full_day"
  | "custom_work_hours";

export type WorkAffectedPeriod = "morning" | "afternoon" | "full_day";

export type WorkExceptionImpact = {
  workExceptionType?: WorkExceptionType;
  affectedPeriod?: WorkAffectedPeriod;
  workExceptionSource?: "user" | "conversation";
  workExceptionReason?: string;
};

export function isPartialWorkException(
  type: WorkExceptionType | undefined,
): boolean {
  return (
    type === "no_work_morning" ||
    type === "no_work_afternoon" ||
    type === "work_morning_only" ||
    type === "work_afternoon_only"
  );
}

export function describeWorkExceptionBadge(
  type: WorkExceptionType | undefined,
): string | undefined {
  switch (type) {
    case "no_work_morning":
    case "work_afternoon_only":
      return "Matin libre";
    case "no_work_afternoon":
    case "work_morning_only":
      return "Matin travaillé";
    default:
      return undefined;
  }
}

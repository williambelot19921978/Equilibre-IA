import { parseTimeToMinutes } from "../time/daySchedule";
import type { NlpEntity, NlpRuntimeContext } from "../../types/nlp";

const MORNING_END_LIMIT_MINUTES = 13 * 60;

export function enrichWorkEntities(
  entities: NlpEntity,
  runtime: Pick<NlpRuntimeContext, "defaultWorkStart" | "defaultWorkEnd">,
): NlpEntity {
  const next = { ...entities };

  if (entities.workExceptionKind === "work_morning_only") {
    if (!next.workTimeStart && runtime.defaultWorkStart) {
      next.workTimeStart = runtime.defaultWorkStart;
    }

    if (!next.workTimeEnd && runtime.defaultWorkEnd) {
      const endMinutes = parseTimeToMinutes(runtime.defaultWorkEnd);
      if (endMinutes !== null && endMinutes <= MORNING_END_LIMIT_MINUTES) {
        next.workTimeEnd = runtime.defaultWorkEnd;
      }
    }

    if (!next.times.length && next.workTimeStart) {
      next.times = [next.workTimeStart];
      if (next.workTimeEnd) {
        next.times.push(next.workTimeEnd);
      }
    }
  }

  if (entities.workExceptionKind === "work_afternoon_only") {
    if (!next.workTimeStart && runtime.defaultWorkStart) {
      const startMinutes = parseTimeToMinutes(runtime.defaultWorkStart);
      if (startMinutes !== null && startMinutes >= 12 * 60) {
        next.workTimeStart = runtime.defaultWorkStart;
      }
    }
  }

  return next;
}

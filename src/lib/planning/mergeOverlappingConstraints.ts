import type { DayConstraint } from "../../types/planning";
import { getDurationMinutes } from "../time/daySchedule";

const NON_MERGEABLE_TYPES = new Set<DayConstraint["type"]>(["wake", "sleep"]);

function sortByStart(constraints: DayConstraint[]): DayConstraint[] {
  return [...constraints].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

function mergePair(current: DayConstraint, next: DayConstraint): DayConstraint {
  const currentEndMs = new Date(current.endsAt).getTime();
  const nextEndMs = new Date(next.endsAt).getTime();
  const mergedEndMs = Math.max(currentEndMs, nextEndMs);
  const mergedTitles = Array.from(
    new Set([current.title, next.title].filter(Boolean)),
  );
  const mergedSources = Array.from(
    new Set([current.source, next.source].filter(Boolean)),
  );

  return {
    ...current,
    endsAt: new Date(mergedEndMs).toISOString(),
    title: mergedTitles.join(" + "),
    source: mergedSources.includes("manual") ? "manual" : current.source,
    incompleteReason:
      mergedTitles.length > 1
        ? `Créneaux fusionnés : ${mergedTitles.join(", ")}.`
        : current.incompleteReason,
  };
}

export function mergeOverlappingConstraints(
  constraints: DayConstraint[],
): DayConstraint[] {
  const fixed = constraints.filter((constraint) =>
    NON_MERGEABLE_TYPES.has(constraint.type),
  );
  const mergeable = sortByStart(
    constraints.filter((constraint) => !NON_MERGEABLE_TYPES.has(constraint.type)),
  );

  if (mergeable.length === 0) {
    return sortByStart(constraints);
  }

  const merged: DayConstraint[] = [];
  let current = mergeable[0];

  for (let index = 1; index < mergeable.length; index += 1) {
    const next = mergeable[index];
    const currentEndMs = new Date(current.endsAt).getTime();
    const nextStartMs = new Date(next.startsAt).getTime();

    if (nextStartMs < currentEndMs) {
      current = mergePair(current, next);
      continue;
    }

    if (getDurationMinutes(current.startsAt, current.endsAt) > 0) {
      merged.push(current);
    }

    current = next;
  }

  if (getDurationMinutes(current.startsAt, current.endsAt) > 0) {
    merged.push(current);
  }

  return sortByStart([...fixed, ...merged]);
}

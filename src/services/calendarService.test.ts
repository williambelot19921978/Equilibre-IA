import { describe, expect, it } from "vitest";

import { MANUAL_CONSTRAINT_SOURCE } from "../config/calendarSources";
import { buildManualConstraintInsert } from "../lib/calendar/manualConstraint";

describe("manual constraint insert payload", () => {
  it("utilise source=user et item_type=event conformes au schéma Supabase", () => {
    const payload = buildManualConstraintInsert({
      householdId: "household-1",
      userId: "user-1",
      title: "Rendez-vous pédiatre",
      constraintType: "appointment",
      startsAt: "2026-07-13T09:00:00.000Z",
      endsAt: "2026-07-13T10:00:00.000Z",
    });

    expect(payload.source).toBe("user");
    expect(payload.source).toBe(MANUAL_CONSTRAINT_SOURCE);
    expect(payload.item_type).toBe("event");
    expect(payload.locked).toBe(true);
    expect(payload.household_id).toBe("household-1");
    expect(payload.user_id).toBe("user-1");
    expect(payload.task_id).toBeNull();
    expect(payload.title).toBe("Rendez-vous pédiatre");
    expect(new Date(payload.ends_at).getTime()).toBeGreaterThan(
      new Date(payload.starts_at).getTime(),
    );
  });

  it("n'utilise pas source=manual (valeur rejetée par le CHECK distant)", () => {
    const payload = buildManualConstraintInsert({
      householdId: "household-1",
      userId: "user-1",
      title: "Test",
      constraintType: "appointment",
      startsAt: "2026-07-13T14:00:00.000Z",
      endsAt: "2026-07-13T15:00:00.000Z",
    });

    expect(payload.source).not.toBe("manual");
    expect(payload.source).not.toBe("engine");
  });
});

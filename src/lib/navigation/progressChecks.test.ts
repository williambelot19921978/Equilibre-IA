import { describe, expect, it } from "vitest";

import { discoveryQuestions } from "../../config/discoveryQuestions";
import {
  calculateDiscoveryProgress,
  getDiscoveryProgressSummary,
  isDiscoveryComplete,
} from "./progressChecks";
import type { ProfileFactRecord } from "../../types";

function fact(key: string, value: string | number | string[] | null): ProfileFactRecord {
  return {
    fact_key: key,
    fact_value: { value },
  };
}

describe("calculateDiscoveryProgress", () => {
  it("aucun fact = 0 %", () => {
    expect(calculateDiscoveryProgress([])).toBe(0);
    expect(getDiscoveryProgressSummary([]).answeredCount).toBe(0);
  });

  it("5 réponses sur 20 applicables", () => {
    const facts = [
      fact("morning_children_responsibility", "me"),
      fact("morning_children_duration", 60),
      fact("children_departure_time", "08:00"),
      fact("children_evening_routine", ["homework"]),
      fact("work_days", ["monday"]),
    ];

    const summary = getDiscoveryProgressSummary(facts);

    expect(summary.answeredCount).toBe(5);
    expect(summary.applicableCount).toBeGreaterThan(5);
    expect(summary.percentage).toBe(
      Math.round((5 / summary.applicableCount) * 100),
    );
    expect(summary.percentage).toBeGreaterThan(0);
    expect(summary.percentage).toBeLessThan(100);
  });

  it("toutes les questions applicables complètes = 100 %", () => {
    const facts: ProfileFactRecord[] = discoveryQuestions
      .filter((question) => !question.dependsOn)
      .map((question) =>
        fact(
          question.key,
          question.type === "multi-select"
            ? ["option"]
            : question.type === "number"
              ? 5
              : "yes",
        ),
      );

    facts.push(fact("studies_active", "no"));
    facts.push(fact("faith_importance", "disabled"));

    const summary = getDiscoveryProgressSummary(facts);

    expect(summary.isComplete).toBe(true);
    expect(summary.percentage).toBe(100);
    expect(isDiscoveryComplete(facts)).toBe(true);
  });

  it("dépendances désactivées — études et foi exclues du dénominateur", () => {
    const facts = [
      fact("studies_active", "no"),
      fact("faith_importance", "disabled"),
      ...discoveryQuestions
        .filter((question) => !question.dependsOn)
        .map((question) =>
          fact(
            question.key,
            question.type === "multi-select" ? ["a"] : "value",
          ),
        ),
    ];

    const summary = getDiscoveryProgressSummary(facts);

    expect(summary.applicableCount).toBeLessThan(discoveryQuestions.length);
    expect(summary.percentage).toBe(100);
    expect(
      discoveryQuestions.some((question) => question.key === "study_weekly_target"),
    ).toBe(true);
  });

  it("facts onboarding existants ne comptent pas seuls dans la progression", () => {
    const facts = [
      fact("main_priority", "family"),
      fact("partner_name", "William"),
    ];

    expect(calculateDiscoveryProgress(facts)).toBe(0);
    expect(isDiscoveryComplete(facts)).toBe(false);
  });

  it("ignore les facts vides (upsert sans valeur réelle)", () => {
    const facts = [
      fact("studies_active", ""),
      fact("morning_children_duration", null),
      fact("work_days", []),
    ];

    expect(getDiscoveryProgressSummary(facts).answeredCount).toBe(0);
  });
});

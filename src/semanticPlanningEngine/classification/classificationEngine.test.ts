import { describe, expect, it } from "vitest";

import { classifyCalendarItem } from "../classification/classificationEngine";
import {
  ITEM_BIRTHDAY,
  ITEM_DENTIST,
  ITEM_GYM,
  ITEM_SPRINT,
  ITEM_TRAVEL,
} from "../testing/fixtures";

describe("EPIC5C classificationEngine", () => {
  it("Dentiste → Santé / Consultation", () => {
    const result = classifyCalendarItem(ITEM_DENTIST);
    expect(result.category).toBe("sante");
    expect(result.subcategory).toBe("Consultation");
  });

  it("Réunion Sprint → Travail / Réunion", () => {
    const result = classifyCalendarItem(ITEM_SPRINT);
    expect(result.category).toBe("travail");
    expect(result.subcategory).toBe("Réunion");
  });

  it("Basic Fit → Sport / Entraînement", () => {
    const result = classifyCalendarItem(ITEM_GYM);
    expect(result.category).toBe("sport");
    expect(result.subcategory).toBe("Entraînement");
  });

  it("Anniversaire → Famille", () => {
    const result = classifyCalendarItem(ITEM_BIRTHDAY);
    expect(result.category).toBe("famille");
  });

  it("Voyage → Déplacement", () => {
    const result = classifyCalendarItem(ITEM_TRAVEL);
    expect(result.category).toBe("deplacement");
  });
});

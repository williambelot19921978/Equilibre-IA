import { describe, expect, it } from "vitest";

import { getButtonClassName } from "./buttonClasses";

describe("Button design system", () => {
  it("G. cancel uses secondary variant classes", () => {
    expect(getButtonClassName({ variant: "secondary" })).toContain(
      "ui-button-secondary",
    );
  });

  it("G. save uses primary variant classes", () => {
    expect(getButtonClassName({ variant: "primary" })).toContain(
      "ui-button-primary",
    );
  });

  it("H. loading state adds loading class", () => {
    expect(getButtonClassName({ loading: true })).toContain(
      "ui-button-loading",
    );
  });

  it("I. buttons always include base ui-button class", () => {
    expect(getButtonClassName()).toBe(
      "ui-button ui-button-primary ui-button-md",
    );
  });
});

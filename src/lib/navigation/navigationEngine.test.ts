import { describe, expect, it } from "vitest";

import {
  isRouteAllowed,
  resolveNavigationRoute,
} from "./navigationEngine";
import { AppRoutes } from "./routes";
import type { UserProgressState } from "./types";

const completedProgress: UserProgressState = {
  hasHousehold: true,
  hasChildren: true,
  hasBaseProfile: true,
  discoveryComplete: true,
  onboardingCompleted: true,
  householdId: "household-1",
  childrenCount: 1,
  welcomeSeen: true,
  introSeen: true,
  childrenStepDone: true,
  profileBasicsDone: true,
  checkinChoiceDone: true,
  goalsStepDone: true,
};

const onboardingProgress: UserProgressState = {
  hasHousehold: true,
  hasChildren: false,
  hasBaseProfile: false,
  discoveryComplete: false,
  onboardingCompleted: false,
  householdId: "household-1",
  childrenCount: 0,
  welcomeSeen: true,
  introSeen: true,
  childrenStepDone: false,
  profileBasicsDone: false,
  checkinChoiceDone: false,
  goalsStepDone: false,
};

describe("navigationEngine refresh rules", () => {
  it("A. keeps /planning on refresh for configured users", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.PLANNING,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(true);
  });

  it("B. keeps /calendar on refresh for configured users", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.CALENDAR,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(true);
  });

  it("C. keeps /tasks on refresh for configured users", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.TASKS,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(true);
  });

  it("D. keeps /daily-routine on refresh for configured users", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.DAILY_ROUTINE,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(true);
  });

  it("E. blocks protected routes when onboarding is incomplete", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.PLANNING,
        resolvedRoute: AppRoutes.CHILDREN,
        progress: onboardingProgress,
      }),
    ).toBe(false);
  });

  it("F. sends new users without household to onboarding household after intro", () => {
    expect(
      resolveNavigationRoute({
        ...onboardingProgress,
        hasHousehold: false,
        householdId: null,
      }),
    ).toBe(AppRoutes.HOUSEHOLD);
  });

  it("G. redirects configured users away from onboarding household", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.HOUSEHOLD,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(false);
  });

  it("H. resolves unknown onboarding step to the current required route", () => {
    expect(resolveNavigationRoute(onboardingProgress)).toBe(AppRoutes.CHILDREN);
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.CHILDREN,
        resolvedRoute: AppRoutes.CHILDREN,
        progress: onboardingProgress,
      }),
    ).toBe(true);
  });

  it("I. EPIC 7A — starts at welcome for brand-new users", () => {
    expect(
      resolveNavigationRoute({
        ...onboardingProgress,
        welcomeSeen: false,
        introSeen: false,
        hasHousehold: false,
        householdId: null,
      }),
    ).toBe(AppRoutes.ONBOARDING_WELCOME);
  });

  it("J. allows /daily-check-in after onboarding", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.DAILY_CHECK_IN,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(true);
  });

  it("K. allows /admin/insights after onboarding", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.ADMIN_INSIGHTS,
        resolvedRoute: AppRoutes.HOME,
        progress: completedProgress,
      }),
    ).toBe(true);
  });

  it("L. allows onboarding back navigation to completed steps", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.HOUSEHOLD,
        resolvedRoute: AppRoutes.CHILDREN,
        progress: onboardingProgress,
      }),
    ).toBe(true);
  });

  it("M. blocks /home when household is missing after onboarding flag", () => {
    expect(
      isRouteAllowed({
        currentPath: AppRoutes.HOME,
        resolvedRoute: AppRoutes.HOUSEHOLD,
        progress: {
          ...completedProgress,
          hasHousehold: false,
          householdId: null,
        },
      }),
    ).toBe(false);
  });
});

/**
 * EPIC 4A — Injectable dependencies for the Context Engine.
 * Defaults wire to existing services — no direct Supabase in the engine.
 */

import { getChildrenByHousehold } from "../../../services/childrenService";
import {
  getHouseholdMembers,
  getHouseholdMembership,
} from "../../../services/householdService";
import { loadHabitProfile } from "../../../services/habitProfileService";
import { loadLivingMemory } from "../../../services/livingMemoryService";
import {
  loadHouseholdMemoryContext,
  loadPlanningContextForDate,
  loadProfileFactsSafe,
} from "../../../services/memoryContextService";
import { loadDisplayedDayPlan } from "../../../services/planningService";
import { getUserProfile } from "../../../services/profileService";
import { getUserGoals } from "../../../services/goalsService";
import { getUserTasks } from "../../../services/tasksService";

import type { UserGoal } from "../../../types/goal";

export type ContextEngineDependencies = {
  readonly getUserProfile: typeof import("../../../services/profileService").getUserProfile;
  readonly getHouseholdMembership: typeof import("../../../services/householdService").getHouseholdMembership;
  readonly getHouseholdMembers: typeof import("../../../services/householdService").getHouseholdMembers;
  readonly getChildrenByHousehold: typeof import("../../../services/childrenService").getChildrenByHousehold;
  readonly loadHouseholdMemoryContext: typeof import("../../../services/memoryContextService").loadHouseholdMemoryContext;
  readonly loadPlanningContextForDate: typeof import("../../../services/memoryContextService").loadPlanningContextForDate;
  readonly loadDisplayedDayPlan: typeof import("../../../services/planningService").loadDisplayedDayPlan;
  readonly getUserTasks: typeof import("../../../services/tasksService").getUserTasks;
  readonly getUserGoals: (userId: string) => UserGoal[] | Promise<UserGoal[]>;
  readonly loadLivingMemory: typeof import("../../../services/livingMemoryService").loadLivingMemory;
  readonly loadHabitProfile: typeof import("../../../services/habitProfileService").loadHabitProfile;
  readonly loadProfileFactsSafe: typeof import("../../../services/memoryContextService").loadProfileFactsSafe;
};

export const defaultContextEngineDependencies: ContextEngineDependencies = {
  getUserProfile,
  getHouseholdMembership,
  getHouseholdMembers,
  getChildrenByHousehold,
  loadHouseholdMemoryContext,
  loadPlanningContextForDate,
  loadDisplayedDayPlan,
  getUserTasks,
  getUserGoals,
  loadLivingMemory,
  loadHabitProfile,
  loadProfileFactsSafe,
};

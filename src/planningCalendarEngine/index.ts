/** EPIC 5A — Public API */

export type {
  CalendarItem,
  CalendarItemType,
  CalendarItemStatus,
  CalendarSyncState,
  CalendarItemOrigin,
  CalendarRecurrence,
  CalendarParticipant,
  Timeline,
  CalendarConflict,
  CalendarConflictKind,
  FreeSlot,
  CalendarSourceInfo,
  PlanningCalendarQuery,
  PlanningCalendarSnapshot,
} from "./types/calendarItem";

export type { ICalendarProvider, ProviderFetchResult } from "./providers/calendarProvider";
export { mergeCalendarItems, countMergedEvents } from "./merge/mergeEngine";
export { detectCalendarConflicts } from "./conflict/conflictEngine";
export { findFreeSlots, sumFreeMinutes } from "./freeSlot/freeSlotEngine";

export {
  PlanningCalendarEngine,
  defaultPlanningCalendarEngine,
} from "./engine/planningCalendarEngine";
export type { ReorganizeDayInput } from "./engine/planningCalendarEngine";
export {
  defaultPlanningCalendarEngineDependencies,
  createDefaultProviders,
} from "./engine/planningCalendarEngineDependencies";
export type { PlanningCalendarEngineDependencies } from "./engine/planningCalendarEngineDependencies";

export { PlanningCalendarApi, planningCalendarApi } from "./api/planningCalendarApi";

export {
  CALENDAR_CONNECTOR_NOT_IMPLEMENTED,
  CALENDAR_CONNECTORS,
  createStubCalendarConnector,
} from "./contract/calendarConnector";
export type { CalendarConnector, CalendarConnectorResult } from "./contract/calendarConnector";

export type {
  DailyBriefPlanningInput,
  IDailyBriefPlanningPort,
} from "./ports/dailyBriefPlanningPort";
export { createDailyBriefPlanningPort } from "./ports/dailyBriefPlanningPortImpl";

export { createInternalPlanningProvider } from "./providers/internalPlanningProvider";
export { createTaskProvider } from "./providers/taskProvider";
export { createGoalProvider } from "./providers/goalProvider";
export { FUTURE_EXTERNAL_PROVIDERS } from "./providers/futureExternalProviders";
export {
  calendarRecordToItem,
  taskToCalendarItem,
  goalToCalendarItem,
} from "./providers/mappers";

export { buildPlanningDiagnostics } from "./diagnostics/buildPlanningDiagnostics";
export type { PlanningDiagnostics } from "./diagnostics/buildPlanningDiagnostics";

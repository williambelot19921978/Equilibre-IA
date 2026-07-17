import type { WorkSchedulePatternData } from "../../../types/workSchedule";
import type { MemoryInsight, PlanningContext } from "../../../ai/memoryEngine";
import type { HouseholdMemoryContext } from "../../../ai/memoryEngine";
import type { MonthOverviewData } from "../../../services/calendarMonthDataService";
import type { MonthDisplayEvent } from "../../../lib/planning/monthEventLayout";
import type { DayTimelineEntry } from "../../../lib/planning/displayedDayTimeline";
import type { DayDisplayMode } from "../../../lib/planning/dayDisplayMode";
import type { ProfileFactRecord } from "../../../types";
import type { FamilyContextPeriodRecord } from "../../../types/familyContext";
import type { FreeTimeSuggestion } from "../../../types/freeTimeSuggestion";
import type { NoTimeChoice, RescheduleOption } from "../../../types/taskActivity";
import type { WorkoutSession } from "../../../types/workoutSession";

export type HomeWidgetContext = {
  firstName: string;
  userId: string | undefined;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  timeline: DayTimelineEntry[];
  plan: {
    fillPercentage: number;
    freeMinutesRemaining: number;
  } | null;
  loadingPlan: boolean;
  generating: boolean;
  planError: string;
  displayMode: DayDisplayMode;
  canRegenerate: boolean;
  isLiveToday: boolean;
  now: Date;
  generatePlan: () => Promise<void>;
  regeneratePlan: () => Promise<void>;
  markedDates: string[];
  monthOverview: MonthOverviewData;
  displayEvents: MonthDisplayEvent[];
  loadingMarkers: boolean;
  workDays: string[];
  workSchedulePattern?: WorkSchedulePatternData | null;
  contextPeriods: FamilyContextPeriodRecord[];
  memoryContext: HouseholdMemoryContext | null;
  showSpiritualHomeCard: boolean;
  showSaintCalendar: boolean;
  contextHints: string[];
  contextHintsError: string;
  profileFacts: ProfileFactRecord[];
  insights: MemoryInsight[];
  loadingMemory: boolean;
  memoryError: string;
  discoveryProgress: {
    percentage: number;
    answeredCount: number;
    applicableCount: number;
  };
  planningContext: PlanningContext | null;
  nextActivity: DayTimelineEntry | null;
  nextFreeSlot: { startsAt: string; durationMinutes: number } | null;
  onOpenSpiritual: () => void;
  onAddCalmMoment: () => void;
  onOpenPlanning: () => void;
  onOpenDiscovery: () => void;
  onShowVacationForm: () => void;
  onSuggestEntry: (entry: DayTimelineEntry) => void;
  onEditEntry?: (entry: DayTimelineEntry) => void;
  formatTime: (iso: string) => string;
  formatDateLabel: (date: string) => string;
  suggestionEntry: DayTimelineEntry | null;
  setSuggestionEntry: (entry: DayTimelineEntry | null) => void;
  handleAcceptSuggestion: (
    suggestion: FreeTimeSuggestion,
    content?: Record<string, unknown>,
  ) => Promise<void>;
  savingSuggestion: boolean;
  onRescheduleEntry?: (entry: DayTimelineEntry, option: RescheduleOption) => void;
  onNoTimeEntry?: (entry: DayTimelineEntry, choice: NoTimeChoice) => void;
  onCompleteEntry?: (entry: DayTimelineEntry) => void;
  completingEntryId?: string | null;
  cancellingEntryId?: string | null;
  onCancelEntry?: (entry: DayTimelineEntry) => void;
  getWorkoutSession?: (entry: DayTimelineEntry) => WorkoutSession | null;
  onAcceptSportProposal?: (entry: DayTimelineEntry, session: WorkoutSession) => void;
  onRegenerateSportProposal?: (entry: DayTimelineEntry) => void;
  onChangeSportLevel?: (
    entry: DayTimelineEntry,
    level: import("../../../types/workoutSession").WorkoutLevel,
  ) => void;
  onChangeSportType?: (
    entry: DayTimelineEntry,
    type: import("../../../types/workoutSession").WorkoutSessionType,
  ) => void;
  onChangeSportDuration?: (
    entry: DayTimelineEntry,
    durationMinutes: number,
  ) => void;
  sportAlternateEntryId?: string | null;
  onDismissSportAlternate?: () => void;
  sportSaving?: boolean;
  onStartWorkout?: (entry: DayTimelineEntry) => void;
  onGenerateWorkout?: (entry: DayTimelineEntry) => void;
  onRegenerateWorkout?: (entry: DayTimelineEntry) => void;
  openingWorkout?: boolean;
  workoutCompletedToday?: boolean;
  lastEditExplanation?: string;
};

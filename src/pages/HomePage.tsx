import { useCallback, useEffect, useMemo, useState } from "react";

import { getHomeContextHints } from "../ai/familyContextEngine";
import {
  generateMemoryInsights,
  type PlanningContext,
} from "../ai/memoryEngine";
import { EditBlockModal } from "../components/planning/EditBlockModal";
import { VacationQuickForm } from "../components/family/VacationQuickForm";
import { HomeCustomizationModal } from "../components/home/HomeCustomizationModal";
import { HomeWidgetRenderer } from "../components/home/widgets/HomeWidgetRenderer";
import type { HomeWidgetContext } from "../components/home/widgets/types";
import { AddToDayModal } from "../components/spiritual/AddToDayModal";
import { shouldShowHomeSpiritualCard } from "../ai/spiritualSuggestionEngine";
import { buildSpiritualPreferences } from "../lib/spiritual/preferences";
import { Button } from "../components/ui/Button";
import { FreeTimeSuggestionModal } from "../components/planning/FreeTimeSuggestionModal";
import { DailyCheckinWidget } from "../components/home/DailyCheckinWidget";
import { RecentAchievementWidget } from "../components/home/RecentAchievementWidget";
import { DayNavigationBar } from "../components/planning/DayNavigationBar";
import { ProactiveCoachBanner } from "../components/coach/ProactiveCoachBanner";
import { DailyMissionBanner } from "../components/coach/DailyMissionBanner";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  getOrderedVisibleWidgets,
  resolveCalendarWidgetPosition,
} from "../services/homePreferencesService";
import type { WorkoutSession } from "../types/workoutSession";
import { useHomePreferences } from "../hooks/useHomePreferences";
import { useSidebarPreferences } from "../hooks/useSidebarPreferences";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { getDiscoveryProgressSummary } from "../lib/navigation/progressChecks";
import type { MonthDisplayEvent } from "../lib/planning/monthEventLayout";
import { formatDateLabel } from "../lib/navigation/urlDate";
import { extractWorkDaysFromFacts } from "../lib/profile/extractWorkDays";
import {
  getNextTimelineEntry,
  type DayTimelineEntry,
} from "../lib/planning/displayedDayTimeline";
import { isTimelineEntryCompletable } from "../lib/planning/isTimelineEntryCompletable";
import { computeNextFreeSlot } from "../lib/planning/daySummary";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useDayPlan } from "../hooks/useDayPlan";
import { useNowClock } from "../hooks/useNowClock";
import { isToday } from "../lib/time/deviceClock";
import { loadMonthDisplayData } from "../services/calendarMonthDisplayService";
import type { MonthOverviewData } from "../services/calendarMonthDataService";
import {
  loadHouseholdMemoryContext,
  loadPlanningContextWithLife,
  loadProfileFactsSafe,
} from "../services/memoryContextService";
import { getHouseholdMembers } from "../services/householdService";
import { acceptFreeTimeSuggestion } from "../services/suggestionAcceptanceService";
import { loadDailyCheckin, saveDailyCheckin } from "../services/dailyCheckinService";
import type { DailyCheckinMood, DailyCheckinRecord } from "../types/dailyCheckin";
import { addSpiritualActivityToPlanning } from "../services/spiritualPlanningService";
import { loadActiveWorkSchedulePattern } from "../services/workScheduleService";
import type { HouseholdMemoryContext } from "../ai/memoryEngine";
import type { WorkSchedulePatternData } from "../types/workSchedule";
import type { ProfileFactRecord } from "../types";
import type { FreeTimeSuggestion } from "../types/freeTimeSuggestion";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function HomePage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();
  const {
    selectedDate,
    setSelectedDate,
    timeline,
    items,
    plan,
    loading: loadingPlan,
    generating,
    error: planError,
    loadPlan,
    generatePlan,
    regeneratePlan,
    displayMode,
    canRegenerate,
    handleBlockAction,
    lastEditExplanation,
    editTimelineBlock,
    savingEdit,
    completingEntryId,
    cancellingEntryId,
    sportSaving,
    sportAlternateEntryId,
    acceptSportProposalEntry,
    regenerateSportProposal,
    changeSportLevel,
    changeSportType,
    changeSportDuration,
    dismissSportAlternate,
    openingWorkout,
    openWorkoutSessionForEntry,
    generateWorkoutForEntry,
    recentAchievement,
    setRecentAchievement,
    lifeContext,
  } = useDayPlan();

  const [dailyCheckin, setDailyCheckin] = useState<DailyCheckinRecord | null>(null);
  const [savingCheckin, setSavingCheckin] = useState(false);

  useEffect(() => {
    if (!user) {
      setDailyCheckin(null);
      return;
    }
    void loadDailyCheckin({ userId: user.id, date: selectedDate })
      .then(setDailyCheckin)
      .catch(() => setDailyCheckin(null));
  }, [user, selectedDate]);

  const handleSaveCheckin = useCallback(
    async (mood: DailyCheckinMood, intensity: number | null) => {
      if (!user) return;
      setSavingCheckin(true);
      try {
        const saved = await saveDailyCheckin({
          userId: user.id,
          date: selectedDate,
          input: { mood, intensity },
        });
        setDailyCheckin(saved);
        await loadPlan();
      } finally {
        setSavingCheckin(false);
      }
    },
    [user, selectedDate, loadPlan],
  );

  const now = useNowClock();
  const isLiveToday = isToday(selectedDate);

  const [profileFacts, setProfileFacts] = useState<ProfileFactRecord[]>([]);
  const [memoryContext, setMemoryContext] =
    useState<HouseholdMemoryContext | null>(null);
  const [loadingMemory, setLoadingMemory] = useState(true);
  const [memoryError, setMemoryError] = useState("");
  const [contextHintsError, setContextHintsError] = useState("");
  const [contextHints, setContextHints] = useState<string[]>([]);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [displayEvents, setDisplayEvents] = useState<MonthDisplayEvent[]>([]);
  const [monthOverview, setMonthOverview] = useState<MonthOverviewData>({});
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [suggestionEntry, setSuggestionEntry] =
    useState<DayTimelineEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<DayTimelineEntry | null>(null);
  const [showCalmModal, setShowCalmModal] = useState(false);
  const [calmSuccess, setCalmSuccess] = useState("");
  const [savingSuggestion, setSavingSuggestion] = useState(false);
  const [suggestionSuccess, setSuggestionSuccess] = useState<string | null>(null);
  const [planningContext, setPlanningContext] =
    useState<PlanningContext | null>(null);

  const [showCustomization, setShowCustomization] = useState(false);
  const {
    preferences,
    updatePreferences,
    saving: savingPreferences,
  } = useHomePreferences(user?.id);
  const isMobile = useIsMobile();
  const calendarPosition = resolveCalendarWidgetPosition(preferences, isMobile);
  const stackWidgets = getOrderedVisibleWidgets(preferences).filter((id) => {
    if (id === "calendar" && calendarPosition !== "hidden") {
      return false;
    }
    return true;
  });
  const { showSaintCalendar } = useSidebarPreferences();
  const [workSchedulePattern, setWorkSchedulePattern] =
    useState<WorkSchedulePatternData | null>(null);

  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Bienvenue";

  useAppPageTitle(`Bonjour ${firstName}`);

  const spiritualPreferences = useMemo(
    () =>
      memoryContext
        ? buildSpiritualPreferences(memoryContext.profile)
        : null,
    [memoryContext],
  );

  const showSpiritualHomeCard =
    spiritualPreferences &&
    shouldShowHomeSpiritualCard(spiritualPreferences);

  const householdId = memoryContext?.householdId ?? null;

  async function handleAddCalmMoment(options: {
    schedule: "now" | "next_free" | "custom";
    durationMinutes: number;
    customStartTime?: string;
  }) {
    if (!user) return;

    await addSpiritualActivityToPlanning({
      userId: user.id,
      date: selectedDate,
      title: "Temps calme",
      durationMinutes: options.durationMinutes,
      schedule: options.schedule,
      customStartTime: options.customStartTime,
      preferredMoment: spiritualPreferences?.preferredMoment,
      spiritualActivityType: "silence",
      sourceReason: "Ajouté depuis l'accueil",
    });

    setCalmSuccess("Temps calme ajouté à ta journée.");
    await loadPlan();
  }

  const reloadMemoryContext = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingMemory(true);
      setMemoryError("");
      setContextHintsError("");

      const [factsResult, memoryResult] = await Promise.allSettled([
        loadProfileFactsSafe(user.id),
        loadHouseholdMemoryContext(user.id),
      ]);

      if (factsResult.status === "fulfilled") {
        setProfileFacts(factsResult.value);
      } else {
        setProfileFacts([]);
        setMemoryError(
          factsResult.reason instanceof Error
            ? factsResult.reason.message
            : "Impossible de charger tes réponses (profile_facts).",
        );
      }

      if (memoryResult.status === "fulfilled") {
        const context = memoryResult.value;
        setMemoryContext(context);

        void loadActiveWorkSchedulePattern(user.id)
          .then(setWorkSchedulePattern)
          .catch(() => setWorkSchedulePattern(null));

        if (context.householdId) {
          try {
            const members = await getHouseholdMembers(context.householdId);
            const memberNames = Object.fromEntries(
              members.map((member) => [member.user_id, member.display_name]),
            );

            setContextHints(
              getHomeContextHints({
                periods: context.familyContextPeriods,
                date: selectedDate,
                currentUserId: user.id,
                memberNames,
              }),
            );
          } catch (hintError) {
            setContextHints([]);
            setContextHintsError(
              hintError instanceof Error
                ? hintError.message
                : "Contexte familial temporairement indisponible.",
            );
          }
        }
      } else if (factsResult.status === "fulfilled") {
        setMemoryContext(null);
        setMemoryError(
          memoryResult.reason instanceof Error
            ? `Mémoire partielle : ${memoryResult.reason.message}`
            : "Certaines données du foyer sont indisponibles.",
        );
      }
    } catch (error) {
      setMemoryError(
        error instanceof Error
          ? error.message
          : "Impossible de charger ta mémoire.",
      );
    } finally {
      setLoadingMemory(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    void reloadMemoryContext();
  }, [reloadMemoryContext]);

  useEffect(() => {
    async function loadPlanningContext() {
      if (!user) {
        setPlanningContext(null);
        return;
      }

      try {
        const context = await loadPlanningContextWithLife({
          userId: user.id,
          date: selectedDate,
        });
        setPlanningContext(context);
      } catch {
        setPlanningContext(null);
      }
    }

    void loadPlanningContext();
  }, [user, selectedDate]);

  useEffect(() => {
    async function loadMarkers() {
      if (!user || !householdId) {
        setMarkedDates([]);
        setDisplayEvents([]);
        return;
      }

      const date = new Date(`${selectedDate}T12:00:00`);

      try {
        setLoadingMarkers(true);
        const { overview, displayEvents: events } = await loadMonthDisplayData({
          userId: user.id,
          householdId,
          year: date.getFullYear(),
          month: date.getMonth(),
          periods: memoryContext?.familyContextPeriods ?? [],
          workDays: extractWorkDaysFromFacts(profileFacts),
        });
        setDisplayEvents(events);
        setMonthOverview(overview);
        setMarkedDates(
          Object.values(overview)
            .filter((day) => day.items.length > 0 || day.colorCategories.length > 0)
            .map((day) => day.date),
        );
      } catch {
        setMarkedDates([]);
        setDisplayEvents([]);
      } finally {
        setLoadingMarkers(false);
      }
    }

    void loadMarkers();
  }, [user, householdId, selectedDate, memoryContext, profileFacts]);

  const insights = useMemo(
    () =>
      memoryContext ? generateMemoryInsights(memoryContext.profile) : [],
    [memoryContext],
  );

  const discoveryProgress = useMemo(
    () => getDiscoveryProgressSummary(profileFacts),
    [profileFacts],
  );

  const workDays = useMemo(
    () => extractWorkDaysFromFacts(profileFacts),
    [profileFacts],
  );

  const nextActivity = isLiveToday
    ? getNextTimelineEntry(timeline, now)
    : getNextTimelineEntry(timeline);
  const nextFreeSlot = computeNextFreeSlot(items);

  const handleAcceptSuggestion = useCallback(
    async (
      suggestion: FreeTimeSuggestion,
      content?: Record<string, unknown>,
    ) => {
      if (!user || !suggestionEntry) return;

      try {
        setSavingSuggestion(true);
        const result = await acceptFreeTimeSuggestion({
          userId: user.id,
          date: selectedDate,
          entry: suggestionEntry,
          suggestion,
          content,
        });
        setSuggestionEntry(null);
        setSuggestionSuccess(result.explanation);
        await loadPlan();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Impossible d’ajouter cette activité.",
        );
      } finally {
        setSavingSuggestion(false);
      }
    },
    [user, suggestionEntry, selectedDate, loadPlan],
  );

  const runGeneratePlan = useCallback(async () => {
    await generatePlan();
  }, [generatePlan]);

  const runRegeneratePlan = useCallback(async () => {
    await regeneratePlan();
  }, [regeneratePlan]);

  const handleCompleteEntry = useCallback(
    async (entry: DayTimelineEntry) => {
      const result = await handleBlockAction({ entry, action: "complete" });
      if (result) {
        setEditingEntry(null);
      }
    },
    [handleBlockAction],
  );

  const getWorkoutSession = useCallback(
    (entry: DayTimelineEntry): WorkoutSession | null => {
      if (entry.workoutSession) return entry.workoutSession;
      const item = items.find((i) => i.id === entry.calendarItemId);
      const session = item?.details?.workoutSession;
      return session && typeof session === "object"
        ? (session as WorkoutSession)
        : null;
    },
    [items],
  );

  const widgetContext = useMemo<HomeWidgetContext>(
    () => ({
      firstName,
      userId: user?.id,
      selectedDate,
      setSelectedDate,
      timeline,
      plan,
      loadingPlan,
      generating,
      planError,
      displayMode,
      canRegenerate,
      isLiveToday,
      now,
      generatePlan: runGeneratePlan,
      regeneratePlan: runRegeneratePlan,
      markedDates,
      monthOverview,
      displayEvents,
      loadingMarkers,
      workDays,
      workSchedulePattern,
      contextPeriods: memoryContext?.familyContextPeriods ?? [],
      memoryContext,
      showSpiritualHomeCard: Boolean(showSpiritualHomeCard),
      showSaintCalendar,
      contextHints,
      contextHintsError,
      profileFacts,
      insights,
      loadingMemory,
      memoryError,
      discoveryProgress,
      planningContext,
      nextActivity: nextActivity ?? null,
      nextFreeSlot,
      onOpenSpiritual: () => goToRoute(AppRoutes.SPIRITUAL),
      onAddCalmMoment: () => setShowCalmModal(true),
      onOpenPlanning: () => goToRoute(AppRoutes.PLANNING),
      onOpenDiscovery: () => goToRoute(AppRoutes.DISCOVERY),
      onShowVacationForm: () => setShowVacationForm(true),
      onSuggestEntry: setSuggestionEntry,
      onEditEntry: setEditingEntry,
      formatTime,
      formatDateLabel,
      suggestionEntry,
      setSuggestionEntry,
      handleAcceptSuggestion,
      savingSuggestion,
      onRescheduleEntry: (entry, option) =>
        void handleBlockAction({ entry, action: "reschedule", rescheduleOption: option }),
      onNoTimeEntry: (entry, choice) =>
        void handleBlockAction({ entry, action: "no_time", choice }),
      onCompleteEntry: (entry) => void handleCompleteEntry(entry),
      completingEntryId,
      cancellingEntryId,
      onCancelEntry: (entry) =>
        void handleBlockAction({ entry, action: "cancel" }),
      getWorkoutSession,
      onAcceptSportProposal: (entry, session) =>
        void acceptSportProposalEntry(entry, session),
      onRegenerateSportProposal: (entry) => void regenerateSportProposal(entry),
      onChangeSportLevel: (entry, level) => void changeSportLevel(entry, level),
      onChangeSportType: (entry, type) => void changeSportType(entry, type),
      onChangeSportDuration: (entry, duration) => void changeSportDuration(entry, duration),
      sportAlternateEntryId,
      onDismissSportAlternate: dismissSportAlternate,
      sportSaving,
      onStartWorkout: (entry) => void openWorkoutSessionForEntry(entry),
      onGenerateWorkout: (entry) => void generateWorkoutForEntry(entry),
      onRegenerateWorkout: (entry) => void regenerateSportProposal(entry),
      openingWorkout,
      workoutCompletedToday: lifeContext?.workoutCompletedToday ?? false,
    }),
    [
      firstName,
      user?.id,
      selectedDate,
      timeline,
      plan,
      loadingPlan,
      generating,
      planError,
      displayMode,
      canRegenerate,
      isLiveToday,
      now,
      markedDates,
      monthOverview,
      displayEvents,
      loadingMarkers,
      memoryContext,
      showSpiritualHomeCard,
      contextHints,
      contextHintsError,
      profileFacts,
      insights,
      workDays,
      workSchedulePattern,
      loadingMemory,
      memoryError,
      discoveryProgress,
      planningContext,
      nextActivity,
      nextFreeSlot,
      showSaintCalendar,
      suggestionEntry,
      savingSuggestion,
      goToRoute,
      AppRoutes,
      runGeneratePlan,
      runRegeneratePlan,
      handleAcceptSuggestion,
      handleCompleteEntry,
      completingEntryId,
      cancellingEntryId,
      handleBlockAction,
      getWorkoutSession,
      lastEditExplanation,
      acceptSportProposalEntry,
      regenerateSportProposal,
      changeSportLevel,
      changeSportType,
      sportAlternateEntryId,
      dismissSportAlternate,
      sportSaving,
      openingWorkout,
      openWorkoutSessionForEntry,
      generateWorkoutForEntry,
      items,
    ],
  );

  return (
    <main className="dashboard-page home-page-clean">
      <section className="dashboard-container">
        <header className="home-compact-header">
          <div>
            <p className="ds-label">Accueil</p>
            <h1>Bonjour {firstName}</h1>
          </div>
        </header>

        <ProactiveCoachBanner firstName={firstName} lifeContext={lifeContext} />
        <DailyMissionBanner lifeContext={lifeContext} />

        <DayNavigationBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <div className="home-widgets-stack">
          {user && (
            <DailyCheckinWidget
              date={selectedDate}
              checkin={dailyCheckin}
              saving={savingCheckin}
              onSave={handleSaveCheckin}
            />
          )}
          <RecentAchievementWidget
            achievement={recentAchievement}
            onDismiss={() => setRecentAchievement(null)}
          />
          {lastEditExplanation && (
            <div className="message message-success">{lastEditExplanation}</div>
          )}
          {stackWidgets.map((widgetId) => (
            <HomeWidgetRenderer
              key={widgetId}
              widgetId={widgetId}
              context={widgetContext}
            />
          ))}
        </div>

        <footer className="home-customize-footer">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowCustomization(true)}
          >
            Modifier les éléments de mon accueil
          </Button>
        </footer>
      </section>

      <HomeCustomizationModal
        open={showCustomization}
        preferences={preferences}
        saving={savingPreferences}
        onClose={() => setShowCustomization(false)}
        onSave={async (prefs) => {
          await updatePreferences(prefs);
          setShowCustomization(false);
        }}
      />

      {showVacationForm && user && (
        <VacationQuickForm
          userId={user.id}
          onClose={() => setShowVacationForm(false)}
          onSaved={() => void reloadMemoryContext()}
        />
      )}

      {suggestionEntry && (
        <FreeTimeSuggestionModal
          entry={suggestionEntry}
          date={selectedDate}
          planningContext={planningContext}
          memoryContext={memoryContext}
          userId={user?.id}
          saving={savingSuggestion}
          onClose={() => setSuggestionEntry(null)}
          onAccept={handleAcceptSuggestion}
        />
      )}

      {editingEntry && user && (
        <EditBlockModal
          entry={editingEntry}
          date={selectedDate}
          userId={user.id}
          saving={savingEdit}
          canComplete={isTimelineEntryCompletable(editingEntry)}
          completing={completingEntryId === editingEntry.id}
          onClose={() => setEditingEntry(null)}
          onComplete={async () => {
            await handleCompleteEntry(editingEntry);
          }}
          onSave={async (payload) => {
            const result = await editTimelineBlock({
              entry: editingEntry,
              edit: {
                title: payload.title,
                startsAt: payload.startsAt,
                endsAt: payload.endsAt,
                locked: payload.locked,
                comment: payload.comment,
                scope: payload.scope,
                activityType: payload.activityType,
                adjustment: payload.adjustment,
              },
            });

            if (result) {
              setEditingEntry(null);
            }
          }}
        />
      )}

      {showCalmModal && (
        <AddToDayModal
          open
          title="Temps calme"
          defaultDuration={10}
          onClose={() => setShowCalmModal(false)}
          onConfirm={handleAddCalmMoment}
        />
      )}

      {calmSuccess && (
        <div className="message message-success home-floating-success">
          {calmSuccess}
        </div>
      )}

      {suggestionSuccess && (
        <div className="message message-success home-floating-success">
          {suggestionSuccess}
        </div>
      )}
    </main>
  );
}

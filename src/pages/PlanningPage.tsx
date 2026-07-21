import { useCallback, useEffect, useMemo, useState } from "react";

import type { PlanningContext } from "../ai/memoryEngine";
import type { HouseholdMemoryContext } from "../ai/memoryEngine";
import { DayNavigationBar } from "../components/planning/DayNavigationBar";
import { DayNowStatus } from "../components/planning/DayNowStatus";
import { DayTimeline } from "../components/planning/DayTimeline";
import { EditBlockModal } from "../components/planning/EditBlockModal";
import { LifeDebugPanel } from "../components/planning/LifeDebugPanel";
import { FreeTimeSuggestionModal } from "../components/planning/FreeTimeSuggestionModal";
import { StudySlotRecommendationCard } from "../components/recommendations/StudySlotRecommendationCard";
import {
  StudyRescheduleInfoCard,
  StudyRescheduleProposalCard,
} from "../components/rescheduling/StudyRescheduleProposalCard";
import { RecentAchievementWidget } from "../components/home/RecentAchievementWidget";
import { HouseholdPlanningPrefillBanner } from "../components/householdOverview/HouseholdPlanningPrefillBanner";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAuth } from "../hooks/useAuth";
import { useDayPlan } from "../hooks/useDayPlan";
import { useStudySlotRecommendation } from "../hooks/useStudySlotRecommendation";
import { useStudyRescheduleProposal } from "../hooks/useStudyRescheduleProposal";
import { useNowClock } from "../hooks/useNowClock";
import { isToday } from "../lib/time/deviceClock";
import { formatDateLabel } from "../lib/navigation/urlDate";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { hasGeneratedPlanning } from "../lib/planning/displayedDayTimeline";
import { canModifyTimelineEntry } from "../lib/planning/isTimelineEntryEditable";
import { isTimelineEntryCompletable } from "../lib/planning/isTimelineEntryCompletable";
import {
  loadHouseholdMemoryContext,
  loadPlanningContextWithLife,
} from "../services/memoryContextService";
import { acceptFreeTimeSuggestion } from "../services/suggestionAcceptanceService";
import {
  observePilotProposalAccepted,
  getPilotProposalSession,
} from "../ai/outcome/outcomeObservationBridge";
import type { WorkoutSession } from "../types/workoutSession";
import type { FreeTimeSuggestion } from "../types/freeTimeSuggestion";
import { readHouseholdPlanningCollaborationDraft } from "../lib/householdCollaboration/householdCollaborationDraftStorage";
import type { HouseholdPlanningCollaborationDraft } from "../types/householdCollaboration";

function getWorkIncompleteMessage(incompleteData: string[]): string | null {
  const workMessage = incompleteData.find((item) =>
    item.includes("Horaires de travail estimés"),
  );

  return workMessage ?? null;
}

export function PlanningPage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();
  const {
    selectedDate,
    setSelectedDate,
    plan,
    timeline,
    loading,
    generating,
    savingEdit,
    completingEntryId,
    cancellingEntryId,
    error,
    lastEditExplanation,
    setLastEditExplanation,
    loadPlan,
    generatePlan,
    regeneratePlan,
    editTimelineBlock,
    handleBlockAction,
    items,
    displayMode,
    canRegenerate,
    lifeContext,
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
  } = useDayPlan();

  const now = useNowClock();

  const [editingEntry, setEditingEntry] = useState<DayTimelineEntry | null>(
    null,
  );
  const [suggestionEntry, setSuggestionEntry] =
    useState<DayTimelineEntry | null>(null);
  const [savingSuggestion, setSavingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [planningContext, setPlanningContext] =
    useState<PlanningContext | null>(null);
  const [memoryContext, setMemoryContext] =
    useState<HouseholdMemoryContext | null>(null);
  const [planningCollaborationDraft, setPlanningCollaborationDraft] =
    useState<HouseholdPlanningCollaborationDraft | null>(null);

  const hasGenerated = hasGeneratedPlanning(timeline);
  const workIncompleteMessage = useMemo(
    () => getWorkIncompleteMessage(plan?.incompleteData ?? []),
    [plan?.incompleteData],
  );

  useEffect(() => {
    async function loadContext() {
      if (!user) {
        setPlanningContext(null);
        setMemoryContext(null);
        return;
      }

      try {
        const [planning, memory] = await Promise.all([
          loadPlanningContextWithLife({ userId: user.id, date: selectedDate }),
          loadHouseholdMemoryContext(user.id),
        ]);
        setPlanningContext(planning);
        setMemoryContext(memory);
      } catch {
        setPlanningContext(null);
        setMemoryContext(null);
      }
    }

    void loadContext();
  }, [user, selectedDate]);

  useEffect(() => {
    const draft = readHouseholdPlanningCollaborationDraft();
    if (!draft) {
      setPlanningCollaborationDraft(null);
      return;
    }

    if (draft.date && draft.date !== selectedDate) {
      return;
    }

    setPlanningCollaborationDraft(draft);
  }, [selectedDate]);

  const studyRecommendation = useStudySlotRecommendation({
    userId: user?.id,
    date: selectedDate,
    timeline,
    planningContext,
    memoryContext,
    onAccepted: (explanation) => {
      setLastEditExplanation(explanation);
      void loadPlan();
    },
  });

  const studyReschedule = useStudyRescheduleProposal({
    userId: user?.id,
    date: selectedDate,
    timeline,
    planningContext,
    onMoved: (explanation) => {
      setLastEditExplanation(explanation);
      void loadPlan();
    },
  });

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

        const session = getPilotProposalSession(suggestion.id);
        if (session) {
          observePilotProposalAccepted(session);
        }

        setSuggestionEntry(null);
        setLastEditExplanation(result.explanation);
        await loadPlan();
      } catch (acceptError) {
        setSuggestionError(acceptError instanceof Error
            ? acceptError.message
            : "Impossible d’ajouter cette activité.",);
      } finally {
        setSavingSuggestion(false);
      }
    },
    [user, suggestionEntry, selectedDate, loadPlan, setLastEditExplanation],
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

  const handleCompleteEntry = useCallback(
    async (entry: DayTimelineEntry) => {
      const result = await handleBlockAction({ entry, action: "complete" });
      if (result) {
        setEditingEntry(null);
      }
    },
    [handleBlockAction],
  );

  return (
    <main className="planning-page">
      <section className="planning-container">
        <header className="planning-header-row">
          <div className="planning-header-main">
            <p className="card-label">Planning vivant</p>
            <h1>{formatDateLabel(selectedDate)}</h1>
            <p className="planning-header-subtitle">
              Ta journée complète : contraintes, rendez-vous et tâches sur une
              seule timeline modifiable.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="planning-calendar-link"
            onClick={() => goToRoute(AppRoutes.CALENDAR)}
          >
            Ouvrir le calendrier
          </Button>
        </header>

        <DayNavigationBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <HouseholdPlanningPrefillBanner
          draft={planningCollaborationDraft}
          onDismiss={() => setPlanningCollaborationDraft(null)}
        />

        {error && <div className="message message-error">{error}</div>}

        {suggestionError && (
          <div className="message message-error">{suggestionError}</div>
        )}

        {lastEditExplanation && (
          <div className="message message-success">{lastEditExplanation}</div>
        )}

        {studyRecommendation.visible && studyRecommendation.recommendation && (
          <StudySlotRecommendationCard
            message={studyRecommendation.recommendation.message}
            accepting={studyRecommendation.accepting}
            onStart={() => void studyRecommendation.accept()}
            onLater={studyRecommendation.defer}
            onDismiss={studyRecommendation.dismiss}
          />
        )}

        {studyReschedule.proposal && (
          <StudyRescheduleProposalCard
            message={studyReschedule.proposal.message}
            moving={studyReschedule.moving}
            onMove={() => void studyReschedule.confirmMove()}
            onKeep={studyReschedule.keepCurrentSchedule}
            onDismiss={studyReschedule.dismissProposal}
          />
        )}

        {studyReschedule.noSolutionMessage && (
          <StudyRescheduleInfoCard
            message={studyReschedule.noSolutionMessage}
            onClose={studyReschedule.clearMessages}
          />
        )}

        {studyReschedule.conflictMessage && (
          <StudyRescheduleInfoCard
            message={studyReschedule.conflictMessage}
            onClose={studyReschedule.clearMessages}
          />
        )}

        <RecentAchievementWidget
          achievement={recentAchievement}
          onDismiss={() => setRecentAchievement(null)}
        />

        <section className="planning-actions">
          <Button
            onClick={() => void generatePlan()}
            disabled={generating || savingEdit || savingSuggestion || !canRegenerate}
            loading={generating}
          >
            Générer ma journée
          </Button>

          <Button
            variant="secondary"
            onClick={() => void regeneratePlan()}
            disabled={generating || savingEdit || savingSuggestion}
            loading={generating}
          >
            Recalculer
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToRoute(AppRoutes.DAILY_ROUTINE)}
          >
            Mon quotidien
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToRoute(AppRoutes.FAMILY_CONTEXT)}
          >
            Contexte familial
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToRoute(AppRoutes.HOME)}
          >
            Retour accueil
          </Button>
        </section>

        {loading ? (
          <p>Chargement du planning...</p>
        ) : !plan || timeline.length === 0 ? (
          <EmptyState
            aura="empty"
            title="Ta journée n'est pas encore organisée."
            description="Appuie sur « Générer ma journée » pour créer une première proposition."
            primaryAction={{
              label: "Générer ma journée",
              onClick: () => void generatePlan(),
            }}
          />
        ) : (
          <>
            {(plan.contextAdaptations?.length ?? 0) > 0 && (
              <section className="planning-section context-adaptations">
                <h2>Adaptations du jour</h2>
                <ul className="planning-list">
                  {plan.contextAdaptations?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {(plan.contextWarnings?.length ?? 0) > 0 && (
              <section className="planning-section">
                <h2>Alertes contexte</h2>
                <ul className="planning-list">
                  {plan.contextWarnings?.map((warning) => (
                    <li key={warning.id}>{warning.message}</li>
                  ))}
                </ul>
              </section>
            )}

            {(plan.ignoredCalendarItems?.length ?? 0) > 0 && (
              <section className="planning-section">
                <h2>Éléments à corriger</h2>
                <ul className="planning-list">
                  {plan.ignoredCalendarItems?.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong> — {item.reason}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {plan.incompleteData.length > 0 && (
              <section className="planning-section">
                <h2>Informations incomplètes</h2>
                <ul className="planning-list">
                  {plan.incompleteData.map((item) => (
                    <li key={`incomplete-${item.length}-${item.slice(0, 64)}`}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="planning-section">
              <h2>Timeline du jour</h2>
              <DayNowStatus
                entries={timeline}
                now={now}
                show={isToday(selectedDate)}
              />
              {!hasGenerated && canRegenerate && (
                <p className="planning-hint">
                  Contraintes quotidiennes affichées. Génère la journée pour
                  ajouter des tâches planifiées.
                </p>
              )}
              <DayTimeline
                entries={timeline}
                displayMode={displayMode}
                now={now}
                workIncompleteMessage={workIncompleteMessage}
                dailyRoutineHref={AppRoutes.DAILY_ROUTINE}
                onEditEntry={(entry) => {
                  if (canModifyTimelineEntry(entry, displayMode)) {
                    setEditingEntry(entry);
                  }
                }}
                onSuggestEntry={canRegenerate ? setSuggestionEntry : undefined}
                onRescheduleEntry={(entry, option) =>
                  void handleBlockAction({ entry, action: "reschedule", rescheduleOption: option })
                }
                onNoTimeEntry={(entry, choice) =>
                  void handleBlockAction({ entry, action: "no_time", choice })
                }
                onCannotDoNowEntry={(entry) =>
                  studyReschedule.requestAlternative(entry)
                }
                canOfferSmartReschedule={(entry) =>
                  studyReschedule.canOfferForEntry(entry)
                }
                completingEntryId={completingEntryId}
                cancellingEntryId={cancellingEntryId}
                onCompleteEntry={(entry) => void handleCompleteEntry(entry)}
                onCancelEntry={(entry) =>
                  void handleBlockAction({ entry, action: "cancel" })
                }
                getWorkoutSession={getWorkoutSession}
                onAcceptSportProposal={(entry, session) =>
                  void acceptSportProposalEntry(entry, session)
                }
                onRegenerateSportProposal={(entry) =>
                  void regenerateSportProposal(entry)
                }
                onChangeSportLevel={(entry, level) =>
                  void changeSportLevel(entry, level)
                }
                onChangeSportType={(entry, type) =>
                  void changeSportType(entry, type)
                }
                onChangeSportDuration={(entry, duration) =>
                  void changeSportDuration(entry, duration)
                }
                sportAlternateEntryId={sportAlternateEntryId}
                onDismissSportAlternate={dismissSportAlternate}
                sportSaving={sportSaving}
                onStartWorkout={(entry) => void openWorkoutSessionForEntry(entry)}
                onGenerateWorkout={(entry) => void generateWorkoutForEntry(entry)}
                onRegenerateWorkout={(entry) => void regenerateSportProposal(entry)}
                openingWorkout={openingWorkout}
                workoutCompletedToday={lifeContext?.workoutCompletedToday ?? false}
              />
            </section>

            <LifeDebugPanel lifeContext={lifeContext} />

            <section className="planning-section">
              <h2>Tâches non planifiables</h2>
              {plan.unplannableTasks.length === 0 ? (
                <p>Toutes les tâches prioritaires ont trouvé une place.</p>
              ) : (
                <div className="planning-list-cards">
                  {plan.unplannableTasks.map((task) => (
                    <article className="empty-card" key={task.taskId}>
                      <h3>{task.title}</h3>
                      <p>{task.reason}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="planning-summary">
              <p>
                Temps libre conservé :{" "}
                <strong>{plan.freeMinutesRemaining} min</strong>
              </p>
              <p>
                Remplissage estimé : <strong>{plan.fillPercentage} %</strong>
              </p>
            </section>
          </>
        )}
      </section>

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

    </main>
  );
}

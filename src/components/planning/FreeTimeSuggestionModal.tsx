import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildVacationSuggestionIntro,
  generateFreeTimeSuggestions,
} from "../../ai/freeTimeSuggestionEngine";
import {
  generateWorkoutSession as generateEngineWorkoutSession,
} from "../../ai/workoutGenerationEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { HouseholdMemoryContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import { sportDurationOptionsForType } from "../../lib/planning/resolveSportDuration";
import {
  resolveAvailableStudyRevisionDurations,
  resolveRecommendedStudyRevisionDuration,
  validateStudyRevisionDuration,
} from "../../lib/planning/resolveStudyRevisionDuration";
import { loadCalendarItemsForWeek } from "../../services/planningService";
import { getTasksForPlanning } from "../../services/tasksService";
import { loadTaskActivityEventsForWeek } from "../../services/taskActivityEventService";
import type { TaskRecord } from "../../types";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { FreeTimeSuggestion } from "../../types/freeTimeSuggestion";
import { Button } from "../ui/Button";
import {
  observePilotProposalPresented,
  observePilotProposalDismissed,
  rememberPilotProposalSession,
  getPilotProposalSession,
} from "../../ai/outcome/outcomeObservationBridge";

type FreeTimeSuggestionModalProps = {
  entry: DayTimelineEntry;
  date: string;
  planningContext: PlanningContext | null;
  memoryContext?: HouseholdMemoryContext | null;
  userId?: string;
  saving?: boolean;
  onClose: () => void;
  onAccept: (
    suggestion: FreeTimeSuggestion,
    content?: Record<string, unknown>,
  ) => Promise<void>;
};

const SPORT_TYPE_MAP = {
  walk: "active_walk",
  run: "run",
  mobility: "mobility",
  yoga: "yoga",
  strength: "full_body",
  cardio: "cardio",
  dance: "cardio",
  other: "full_body",
} as const;

type SportType = keyof typeof SPORT_TYPE_MAP;
type SportIntensity = "gentle" | "moderate" | "dynamic";

export function FreeTimeSuggestionModal({
  entry,
  date,
  planningContext,
  memoryContext,
  userId,
  saving = false,
  onClose,
  onAccept,
}: FreeTimeSuggestionModalProps) {
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<FreeTimeSuggestion | null>(null);
  const [sportDuration, setSportDuration] = useState(15);
  const [sportType, setSportType] = useState<SportType>("strength");
  const [sportIntensity, setSportIntensity] = useState<SportIntensity>("gentle");
  const [calmPreference, setCalmPreference] = useState("musique douce");
  const [studyDuration, setStudyDuration] = useState(30);
  const [studyCustomMode, setStudyCustomMode] = useState(false);
  const [studyCustomDuration, setStudyCustomDuration] = useState("25");
  const [studyDurationError, setStudyDurationError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [weekCalendarItems, setWeekCalendarItems] = useState<CalendarItemRecord[]>([]);
  const [weekActivityEvents, setWeekActivityEvents] = useState<TaskActivityEventRecord[]>([]);
  const presentedProposalIdsRef = useRef(new Set<string>());
  const acceptedProposalIdsRef = useRef(new Set<string>());

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) handleCloseModal();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  useEffect(() => {
    if (!userId || !planningContext?.householdId) return;

    let cancelled = false;

    async function loadSuggestionData() {
      try {
        const [loadedTasks, loadedItems, loadedEvents] = await Promise.all([
          getTasksForPlanning(userId!),
          loadCalendarItemsForWeek({
            userId: userId!,
            householdId: planningContext!.householdId,
            referenceDate: date,
          }),
          loadTaskActivityEventsForWeek({
            userId: userId!,
            householdId: planningContext!.householdId,
            referenceDate: date,
          }),
        ]);

        if (!cancelled) {
          setTasks(loadedTasks);
          setWeekCalendarItems(loadedItems);
          setWeekActivityEvents(loadedEvents);
        }
      } catch {
        if (!cancelled) {
          setTasks([]);
          setWeekCalendarItems([]);
          setWeekActivityEvents([]);
        }
      }
    }

    void loadSuggestionData();

    return () => {
      cancelled = true;
    };
  }, [userId, planningContext?.householdId, date]);

  const slotMinutes = useMemo(
    () =>
      Math.round(
        (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
          60_000,
      ),
    [entry.endsAt, entry.startsAt],
  );

  const sportDurationOptions = useMemo(
    () => sportDurationOptionsForType(SPORT_TYPE_MAP[sportType], slotMinutes),
    [sportType, slotMinutes],
  );

  useEffect(() => {
    if (!sportDurationOptions.includes(sportDuration)) {
      setSportDuration(sportDurationOptions[0] ?? 20);
    }
  }, [sportDurationOptions, sportDuration]);

  const studyDurationOptions = useMemo(
    () => resolveAvailableStudyRevisionDurations(slotMinutes),
    [slotMinutes],
  );

  const recommendedStudyDuration = useMemo(() => {
    if (!planningContext) return 30;
    return resolveRecommendedStudyRevisionDuration({
      slotMinutes,
      preferredFocusMinutes:
        planningContext.profile.preferredFocusMinutes ?? 30,
      energy:
        planningContext.lifeContext?.energyPrediction ??
        planningContext.profile.afterWorkEnergy,
      hour: new Date(entry.startsAt).getHours(),
      weeklyGoalMinutes:
        (planningContext.profile.studyWeeklyHours ?? 0) * 60,
    });
  }, [planningContext, slotMinutes, entry.startsAt]);

  useEffect(() => {
    if (studyDurationOptions.length === 0) {
      setStudyDuration(Math.max(5, slotMinutes - 10));
      return;
    }
    const preferred = studyDurationOptions.includes(recommendedStudyDuration)
      ? recommendedStudyDuration
      : studyDurationOptions[0];
    setStudyDuration(preferred);
  }, [recommendedStudyDuration, studyDurationOptions, slotMinutes]);

  useEffect(() => {
    if (selectedSuggestion?.type !== "study") {
      setStudyCustomMode(false);
      setStudyDurationError(null);
    }
  }, [selectedSuggestion]);

  const slot = useMemo(
    () => ({
      id: entry.id,
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      durationMinutes: slotMinutes,
      slotKind: entry.freeSlotKind,
    }),
    [entry, slotMinutes],
  );

  const suggestions = useMemo(() => {
    if (!planningContext) return [];

    return generateFreeTimeSuggestions({
      slot,
      date,
      planningContext,
      memoryContext,
      tasks,
      calendarItems: weekCalendarItems,
      taskActivityEvents: weekActivityEvents,
      primarySuggestion: entry.primarySuggestion,
    });
  }, [
    slot,
    date,
    planningContext,
    memoryContext,
    tasks,
    weekCalendarItems,
    weekActivityEvents,
    entry.primarySuggestion,
  ]);

  useEffect(() => {
    if (!userId || !planningContext || suggestions.length === 0) return;

    for (const suggestion of suggestions) {
      if (suggestion.type === "keep_free") continue;
      if (presentedProposalIdsRef.current.has(suggestion.id)) continue;

      presentedProposalIdsRef.current.add(suggestion.id);
      const session = observePilotProposalPresented({
        userId,
        householdId: planningContext.householdId,
        proposalId: suggestion.id,
      });
      rememberPilotProposalSession(session);
    }
  }, [userId, planningContext, suggestions]);

  function handleCloseModal() {
    for (const proposalId of presentedProposalIdsRef.current) {
      if (acceptedProposalIdsRef.current.has(proposalId)) continue;
      const session = getPilotProposalSession(proposalId);
      if (session && userId && planningContext?.householdId) {
        observePilotProposalDismissed(session);
      }
    }

    presentedProposalIdsRef.current.clear();
    acceptedProposalIdsRef.current.clear();
    onClose();
  }

  function markProposalAccepted(proposalId: string) {
    acceptedProposalIdsRef.current.add(proposalId);
  }

  const intro =
    planningContext &&
    buildVacationSuggestionIntro({ slot, planningContext });

  async function handleStudyConfirm() {
    if (!selectedSuggestion) return;

    const chosenDurationMinutes = studyCustomMode
      ? Number(studyCustomDuration)
      : studyDuration;

    const validation = validateStudyRevisionDuration(
      chosenDurationMinutes,
      slotMinutes,
    );

    if (!validation.valid) {
      setStudyDurationError(validation.message ?? "Durée invalide.");
      return;
    }

    setStudyDurationError(null);

    markProposalAccepted(selectedSuggestion.id);
    await onAccept(selectedSuggestion, {
      ...selectedSuggestion.optionalContent,
      chosenDurationMinutes,
    });
  }

  async function handleKeepFree() {
    const keep = suggestions.find((item) => item.type === "keep_free");
    if (keep) {
      markProposalAccepted(keep.id);
      await onAccept(keep);
    }
  }

  async function handleSportConfirm() {
    if (!selectedSuggestion || !planningContext) return;

    const workout = generateEngineWorkoutSession({
      durationMinutes: sportDuration,
      type: SPORT_TYPE_MAP[sportType],
      slotHour: new Date(entry.startsAt).getHours(),
      energy: planningContext.profile.afterWorkEnergy,
      preferences: {
        level: "intermediate",
        preferredTypes: [SPORT_TYPE_MAP[sportType]],
        avoidedTypes: [],
        availableEquipment: [],
        preferredDurationMinutes: sportDuration,
        minimumDurationMinutes: 10,
        intensity: sportIntensity,
        preferredZones: [],
        weeklyFrequencyGoal: 3,
        location: "both",
      },
    });

    markProposalAccepted(selectedSuggestion.id);
    await onAccept(selectedSuggestion, {
      workoutSession: workout,
      sportType: workout.type,
      intensity: workout.intensity,
    });
  }

  function renderStudyCardContent(suggestion: FreeTimeSuggestion) {
    const progress = suggestion.studyProgress;
    const durationLabel =
      suggestion.recommendedDuration > 0
        ? `${suggestion.recommendedDuration} min`
        : null;

    return (
      <>
        <div className="suggestion-card-heading">
          <strong>{suggestion.title}</strong>
          {suggestion.isPrimaryRecommendation && (
            <span className="suggestion-card-badge">Recommandé</span>
          )}
        </div>
        {durationLabel && (
          <span className="suggestion-card-duration">{durationLabel}</span>
        )}
        {progress && (
          <>
            <span className="suggestion-card-subject">{progress.taskTitle}</span>
            <span className="suggestion-card-progress">{progress.progressLabel}</span>
          </>
        )}
        <small>{suggestion.reason}</small>
      </>
    );
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={handleCloseModal}>
      <div
        className="modal-card suggestion-modal"
        role="dialog"
        aria-labelledby="suggestion-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="card-label">Temps libre</p>
            <h2 id="suggestion-title">Me proposer une activité</h2>
            {intro && <p className="suggestion-intro">{intro}</p>}
          </div>
          <Button variant="secondary" size="sm" onClick={handleCloseModal}>
            Fermer
          </Button>
        </header>

        {!selectedSuggestion ? (
          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className={`suggestion-card${suggestion.isPrimaryRecommendation ? " suggestion-card-primary" : ""}`}
                onClick={() => {
                  if (suggestion.action === "keep_free") {
                    markProposalAccepted(suggestion.id);
                    void onAccept(suggestion);
                    return;
                  }

                  setSelectedSuggestion(suggestion);
                }}
              >
                {suggestion.type === "study" ? (
                  renderStudyCardContent(suggestion)
                ) : (
                  <>
                    <div className="suggestion-card-heading">
                      <strong>{suggestion.title}</strong>
                      {suggestion.isPrimaryRecommendation && (
                        <span className="suggestion-card-badge">Recommandé</span>
                      )}
                    </div>
                    <span>{suggestion.description}</span>
                    <small>{suggestion.reason}</small>
                    {typeof suggestion.confidence === "number" && (
                      <div className="suggestion-confidence">
                        Confiance : <strong>{suggestion.confidence} %</strong>
                        {suggestion.confidenceFactors && (
                          <div className="suggestion-confidence-factors">
                            {suggestion.confidenceFactors.map((factor) => (
                              <span
                                key={factor.id}
                                className={`suggestion-confidence-factor${factor.positive ? "" : " is-negative"}`}
                              >
                                {factor.positive ? "✔" : "✖"} {factor.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        ) : selectedSuggestion.type === "sport" ? (
          <div className="suggestion-detail">
            <h3>Séance sport</h3>
            <label>
              Durée
              <select
                value={sportDuration}
                onChange={(event) =>
                  setSportDuration(Number(event.target.value))
                }
              >
                {sportDurationOptions.map((value) => (
                  <option key={value} value={value}>
                    {value} min
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select
                value={sportType}
                onChange={(event) =>
                  setSportType(event.target.value as SportType)
                }
              >
                <option value="walk">Marche</option>
                <option value="mobility">Mobilité</option>
                <option value="yoga">Yoga</option>
                <option value="strength">Renforcement</option>
                <option value="run">Course</option>
                <option value="dance">Danse</option>
                <option value="other">Autre</option>
              </select>
            </label>
            <label>
              Intensité
              <select
                value={sportIntensity}
                onChange={(event) =>
                  setSportIntensity(event.target.value as SportIntensity)
                }
              >
                <option value="gentle">Douce</option>
                <option value="moderate">Modérée</option>
                <option value="dynamic">Dynamique</option>
              </select>
            </label>
            <footer className="modal-footer">
              <Button variant="secondary" fullWidth onClick={() => setSelectedSuggestion(null)}>
                Retour
              </Button>
              <Button fullWidth loading={saving} onClick={() => void handleSportConfirm()}>
                Ajouter la séance
              </Button>
            </footer>
          </div>
        ) : selectedSuggestion.type === "calm" ? (
          <div className="suggestion-detail">
            <h3>Temps calme</h3>
            <label>
              Préférence
              <select
                value={calmPreference}
                onChange={(event) => setCalmPreference(event.target.value)}
              >
                <option value="musique douce">Musique douce</option>
                <option value="podcast">Podcast</option>
                <option value="histoire">Histoire</option>
                <option value="livre audio">Livre audio</option>
                <option value="silence">Silence</option>
                <option value="minuterie repos">Minuterie de repos</option>
                <option value="prière">Prière ou méditation chrétienne</option>
              </select>
            </label>
            <p className="suggestion-hint">
              Aucun contenu audio ne sera lancé automatiquement.
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() =>
                window.open("https://open.spotify.com/", "_blank", "noopener,noreferrer")
              }
            >
              Ouvrir Spotify
            </Button>
            <footer className="modal-footer">
              <Button variant="secondary" fullWidth onClick={() => setSelectedSuggestion(null)}>
                Retour
              </Button>
              <Button
                fullWidth
                loading={saving}
                onClick={() => {
                  markProposalAccepted(selectedSuggestion.id);
                  void onAccept(selectedSuggestion, {
                    calmPreference,
                    spotifyUrl: "https://open.spotify.com/",
                  });
                }}
              >
                Enregistrer cette préférence
              </Button>
            </footer>
          </div>
        ) : selectedSuggestion.type === "study" ? (
          <div className="suggestion-detail suggestion-detail-study">
            <h3>Révision</h3>
            {selectedSuggestion.studyProgress && (
              <>
                <p className="suggestion-card-subject">
                  {selectedSuggestion.studyProgress.taskTitle}
                </p>
                <p className="suggestion-card-progress">
                  {selectedSuggestion.studyProgress.progressLabel}
                </p>
              </>
            )}
            <p className="suggestion-hint">{selectedSuggestion.reason}</p>

            <p className="study-duration-recommended">
              Durée recommandée : <strong>{recommendedStudyDuration} min</strong>
            </p>

            <div className="study-duration-options" role="group" aria-label="Durée de révision">
              {studyDurationOptions.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`study-duration-chip${!studyCustomMode && studyDuration === minutes ? " study-duration-chip-active" : ""}${minutes === recommendedStudyDuration ? " study-duration-chip-recommended" : ""}`}
                  onClick={() => {
                    setStudyCustomMode(false);
                    setStudyDuration(minutes);
                    setStudyDurationError(null);
                  }}
                >
                  {minutes} min
                </button>
              ))}
              <button
                type="button"
                className={`study-duration-chip${studyCustomMode ? " study-duration-chip-active" : ""}`}
                onClick={() => {
                  setStudyCustomMode(true);
                  setStudyDurationError(null);
                }}
              >
                Personnalisé
              </button>
            </div>

            {studyCustomMode && (
              <label className="study-duration-custom">
                Durée personnalisée (min)
                <input
                  type="number"
                  min={5}
                  max={Math.max(5, slotMinutes - 10)}
                  value={studyCustomDuration}
                  onChange={(event) => {
                    setStudyCustomDuration(event.target.value);
                    setStudyDurationError(null);
                  }}
                />
              </label>
            )}

            {studyDurationError && (
              <p className="suggestion-error">{studyDurationError}</p>
            )}

            <footer className="modal-footer">
              <Button variant="secondary" fullWidth onClick={() => setSelectedSuggestion(null)}>
                Retour
              </Button>
              <Button
                fullWidth
                loading={saving}
                onClick={() => void handleStudyConfirm()}
              >
                Ajouter au planning
              </Button>
            </footer>
          </div>
        ) : (
          <div className="suggestion-detail">
            <h3>{selectedSuggestion.title}</h3>
            <p>{selectedSuggestion.description}</p>
            <p className="suggestion-hint">{selectedSuggestion.reason}</p>
            <footer className="modal-footer">
              <Button variant="secondary" fullWidth onClick={() => setSelectedSuggestion(null)}>
                Retour
              </Button>
              <Button
                fullWidth
                loading={saving}
                onClick={() => {
                  markProposalAccepted(selectedSuggestion.id);
                  void onAccept(
                    selectedSuggestion,
                    selectedSuggestion.optionalContent,
                  );
                }}
              >
                Ajouter à mon planning
              </Button>
            </footer>
          </div>
        )}

        {!selectedSuggestion && (
          <footer className="modal-footer">
            <Button variant="secondary" fullWidth disabled={saving} onClick={() => void handleKeepFree()}>
              Ne rien prévoir
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}

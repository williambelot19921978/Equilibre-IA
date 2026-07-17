import { useState, type FormEvent } from "react";

import {
  getContextTypeLabel,
} from "../ai/familyContextEngine";
import { CalendarFilters } from "../components/calendar/CalendarFilters";
import { CalendarDayStatusLegend } from "../components/calendar/CalendarDayStatusLegend";
import { CalendarLegend } from "../components/calendar/CalendarLegend";
import { MonthCalendar } from "../components/calendar/MonthCalendar";
import { VacationQuickForm } from "../components/family/VacationQuickForm";
import { Button } from "../components/ui/Button";
import type { CalendarFilterId } from "../config/calendarFilters";
import {
  MANUAL_CONSTRAINT_TYPES,
  type ManualConstraintType,
} from "../config/dailyRoutineOptions";
import { isManualCalendarSource } from "../config/calendarSources";
import { MANUAL_CONSTRAINT_ITEM_TYPES } from "../config/calendarItemTypes";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useCalendarViewData } from "../hooks/useCalendarViewData";
import { useUrlDate } from "../hooks/useUrlDate";
import { formatDateLabel } from "../lib/navigation/urlDate";
import type { MonthDayPreviewItem } from "../services/calendarMonthDataService";
import type { MonthDisplayEvent } from "../lib/planning/monthEventLayout";
import {
  confirmAdditionalWorkout,
  hasCompletedWorkoutForDate,
} from "../lib/planning/hasCompletedWorkoutForDate";
import { generateWorkoutSession } from "../ai/workoutGenerationEngine";
import { getDurationMinutes } from "../lib/time/daySchedule";
import {
  createManualConstraint,
  deleteManualConstraint,
  updateManualConstraint,
} from "../services/calendarService";
import { buildConstraintTimestamps } from "../services/calendarService";
import type { CalendarItemRecord } from "../types";
import type { FamilyContextPeriodRecord } from "../types/familyContext";
import {
  CalendarDayItemsSection,
  CalendarPeriodsSection,
} from "./calendar/CalendarSections";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function isoToTimeInput(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getConstraintTypeLabel(value: string | undefined): string {
  return (
    MANUAL_CONSTRAINT_TYPES.find((option) => option.value === value)?.label ??
    "Contrainte"
  );
}

function getCalendarItemTypeLabel(item: CalendarItemRecord): string {
  if (item.details?.constraintType) {
    return getConstraintTypeLabel(item.details.constraintType as string);
  }

  if (item.item_type === "task") return "Tâche";
  if (item.item_type === "event") return "Événement";
  if (item.item_type === "routine") return "Routine";
  if (item.item_type === "buffer") return "Bloc";
  if (item.item_type === "constraint") return "Contrainte";
  if (item.item_type === "margin") return "Marge";

  return item.item_type;
}

function isEditableManualConstraint(item: CalendarItemRecord): boolean {
  return (
    isManualCalendarSource(item.source) &&
    (MANUAL_CONSTRAINT_ITEM_TYPES as readonly string[]).includes(item.item_type)
  );
}

function formatPeriodRange(period: FamilyContextPeriodRecord): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(period.starts_at))} → ${formatter.format(new Date(period.ends_at))}`;
}

export function CalendarPage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();
  const { selectedDate, setSelectedDate } = useUrlDate();
  const {
    householdId,
    householdError,
    calendarItems,
    calendarItemsError,
    periodsError,
    monthOverview,
    displayEvents,
    markedDates,
    monthError,
    workDays,
    workSchedulePattern,
    periods,
    isBootstrapping,
    isRefreshingDay,
    isRefreshingMonth,
    visibleYear,
    visibleMonth,
    activePeriodsForDate,
    handleVisibleMonthChange,
    refresh,
    upsertCalendarItem,
    removeCalendarItem,
  } = useCalendarViewData({
    userId: user?.id,
    selectedDate,
  });

  const [activeFilter, setActiveFilter] = useState<CalendarFilterId>("all");
  const [selectedExternalEvent, setSelectedExternalEvent] =
    useState<MonthDisplayEvent | null>(null);
  const [showVacationForm, setShowVacationForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [constraintType, setConstraintType] =
    useState<ManualConstraintType>("appointment");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [generateSportSession, setGenerateSportSession] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setConstraintType("appointment");
    setStartTime("");
    setEndTime("");
  }

  function startEdit(constraint: CalendarItemRecord) {
    setEditingId(constraint.id);
    setTitle(constraint.title);
    setConstraintType(
      (constraint.details?.constraintType as ManualConstraintType) ??
        "appointment",
    );
    setStartTime(isoToTimeInput(constraint.starts_at));
    setEndTime(isoToTimeInput(constraint.ends_at));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Indique un titre pour la contrainte.");
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage("Indique une heure de début et de fin.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        const updated = await updateManualConstraint({
          constraintId: editingId,
          title: title.trim(),
          constraintType,
          date: selectedDate,
          startTime,
          endTime,
        });
        upsertCalendarItem(updated);
        setSuccessMessage("Contrainte mise à jour.");
      } else {
        if (
          constraintType === "sport" &&
          !confirmAdditionalWorkout(
            hasCompletedWorkoutForDate({
              userId: user.id,
              date: selectedDate,
              calendarItems,
            }),
          )
        ) {
          return;
        }

        const { startsAt, endsAt } = buildConstraintTimestamps(
          selectedDate,
          startTime,
          endTime,
        );
        const durationMinutes = Math.max(
          5,
          getDurationMinutes(startsAt, endsAt) - 5,
        );
        const workoutSession =
          constraintType === "sport" && generateSportSession
            ? generateWorkoutSession({
                durationMinutes,
                slotHour: new Date(startsAt).getHours(),
                generationSeed: `calendar-${Date.now()}`,
              })
            : null;

        const created = await createManualConstraint({
          userId: user.id,
          date: selectedDate,
          title: title.trim(),
          constraintType,
          startTime,
          endTime,
          workoutSession,
          withSession: Boolean(workoutSession),
          sportType: "renforcement",
        });
        upsertCalendarItem(created);
        setSuccessMessage("Contrainte ajoutée — elle est verrouillée pour le planning.");
      }

      await refresh("month");
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la contrainte.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(constraintId: string) {
    if (!householdId) return;

    try {
      setSaving(true);
      await deleteManualConstraint(constraintId);
      removeCalendarItem(constraintId);
      await refresh("month");
      if (editingId === constraintId) {
        resetForm();
      }
      setSuccessMessage("Contrainte supprimée.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la contrainte.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVacationSaved() {
    await refresh("periods");
    await refresh("month");
  }

  function handleEventPreviewClick(item: MonthDayPreviewItem, date: string) {
    setSelectedDate(date);
    startEdit(item.item);
  }

  function handleDisplayEventClick(event: MonthDisplayEvent, date: string) {
    setSelectedDate(date);
    if (event.metadata?.calendarItemId) {
      const preview = monthOverview[date]?.items.find(
        (item) => item.id === event.metadata?.calendarItemId,
      );
      if (preview) {
        handleEventPreviewClick(preview, date);
        return;
      }
    }
    setSelectedExternalEvent(event);
  }

  return (
    <main className="planning-page">
      <section className="planning-container">
        <header className="planning-header">
          <p className="card-label">Calendrier</p>
          <h1>{formatDateLabel(selectedDate)}</h1>
          <p>
            Les contraintes ajoutées ici sont verrouillées — le Planning Engine
            ne les déplacera jamais.
          </p>
        </header>

        <CalendarFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="calendar-month-shell">
          {isRefreshingMonth && Object.keys(monthOverview).length > 0 && (
            <span className="calendar-refresh-badge calendar-refresh-badge-overlay">
              Mise à jour…
            </span>
          )}
          <MonthCalendar
            variant="full"
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            markedDates={markedDates}
            monthOverview={monthOverview}
            displayEvents={displayEvents}
            workDays={workDays}
            workSchedulePattern={workSchedulePattern}
            contextPeriods={periods}
            activeFilter={activeFilter}
            visibleYear={visibleYear}
            visibleMonth={visibleMonth}
            onVisibleMonthChange={handleVisibleMonthChange}
            onDisplayEventClick={handleDisplayEventClick}
            onOverflowClick={setSelectedDate}
          />
        </div>

        <CalendarDayStatusLegend />

        <CalendarLegend />

        {monthError && <div className="message message-error">{monthError}</div>}

        {user && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowVacationForm(true)}
          >
            Ajouter une période de vacances
          </Button>
        )}

        {householdError && (
          <div className="message message-error">{householdError}</div>
        )}

        {errorMessage && (
          <div className="message message-error">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="message message-success">{successMessage}</div>
        )}

        <CalendarDayItemsSection
          title="Éléments du calendrier"
          isBootstrapping={isBootstrapping}
          isRefreshing={isRefreshingDay}
          error={calendarItemsError}
          isEmpty={calendarItems.length === 0}
          emptyMessage="Aucun élément calendrier pour cette date."
        >
          <div className="planning-timeline">
            {calendarItems.map((item) => {
              const editable = isEditableManualConstraint(item);

              return (
                <article
                  className={`planning-block${editable ? " constraint" : ""}`}
                  key={item.id}
                >
                  <div className="planning-block-time">
                    {formatTime(item.starts_at)} – {formatTime(item.ends_at)}
                  </div>
                  <div className="planning-block-content">
                    <span>{getCalendarItemTypeLabel(item)}</span>
                    <h3>{item.title}</h3>
                    {item.locked && <p>🔒 Verrouillée</p>}
                    {editable && (
                      <div className="calendar-item-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(item.id)}
                          disabled={saving}
                        >
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </CalendarDayItemsSection>

        <CalendarPeriodsSection
          isBootstrapping={isBootstrapping}
          isRefreshing={false}
          error={periodsError}
          isEmpty={activePeriodsForDate.length === 0}
          emptyMessage="Aucune période de vacances ou de contexte familial pour cette date."
        >
          <div className="planning-timeline">
            {activePeriodsForDate.map((period) => (
              <article className="planning-block" key={period.id}>
                <div className="planning-block-content">
                  <span>{getContextTypeLabel(period.context_type)}</span>
                  <h3>{period.title}</h3>
                  <p>{formatPeriodRange(period)}</p>
                  {period.description && <p>{period.description}</p>}
                </div>
              </article>
            ))}
          </div>
        </CalendarPeriodsSection>

        <section className="planning-section">
          <h2>{editingId ? "Modifier la contrainte" : "Ajouter une contrainte"}</h2>

          <form onSubmit={handleSubmit} className="auth-form routine-form">
            <label>
              <span>Type</span>
              <select
                value={constraintType}
                onChange={(event) =>
                  setConstraintType(event.target.value as ManualConstraintType)
                }
              >
                {MANUAL_CONSTRAINT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {constraintType === "sport" && (
              <label className="calendar-sport-session-option">
                <input
                  type="checkbox"
                  checked={generateSportSession}
                  onChange={(event) => setGenerateSportSession(event.target.checked)}
                />
                Générer une séance sportive concrète pour ce créneau
              </label>
            )}

            <label>
              <span>Titre</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Rendez-vous pédiatre"
              />
            </label>

            <label>
              <span>Début</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label>
              <span>Fin</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>

            <Button type="submit" loading={saving} disabled={saving}>
              {editingId ? "Mettre à jour" : "Ajouter la contrainte"}
            </Button>

            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Annuler la modification
              </Button>
            )}
          </form>
        </section>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => goToRoute(AppRoutes.PLANNING)}
        >
          Voir mon planning
        </Button>
      </section>

      {selectedExternalEvent && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{selectedExternalEvent.title}</h2>
            <p>{formatDateLabel(selectedExternalEvent.startDate)}</p>
            {selectedExternalEvent.startsAt && !selectedExternalEvent.allDay && (
              <p>
                {formatTime(selectedExternalEvent.startsAt)} –{" "}
                {formatTime(selectedExternalEvent.endsAt ?? selectedExternalEvent.startsAt)}
              </p>
            )}
            <p className="planning-hint">
              Événement importé depuis Google Calendar
            </p>
            {typeof selectedExternalEvent.metadata?.htmlLink === "string" && (
              <Button
                type="button"
                onClick={() =>
                  window.open(
                    String(selectedExternalEvent.metadata?.htmlLink),
                    "_blank",
                  )
                }
              >
                Ouvrir dans Google Calendar
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedExternalEvent(null)}
            >
              Fermer
            </Button>
          </div>
        </div>
      )}

      {showVacationForm && user && (
        <VacationQuickForm
          userId={user.id}
          onClose={() => setShowVacationForm(false)}
          onSaved={() => void handleVacationSaved()}
        />
      )}
    </main>
  );
}

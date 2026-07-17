import { useEffect, useState, type FormEvent } from "react";

import { MealSettingsSection } from "../components/profile/MealSettingsSection";
import { Button } from "../components/ui/Button";
import {
  AFTER_WORK_ENERGY_OPTIONS,
  FOCUS_DURATION_OPTIONS,
  MAIN_PRIORITY_OPTIONS,
  WORK_DAY_OPTIONS,
} from "../config/dailyRoutineOptions";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { upsertChildRoutinesBatch } from "../services/childRoutineService";
import {
  loadDailyRoutine,
  saveDailyRoutine,
} from "../services/dailyRoutineService";
import { loadHouseholdMemoryContext } from "../services/memoryContextService";
import type { ChildRecord } from "../types";
import type { ChildRoutineInput } from "../types/childRoutine";

type ChildRoutineFormState = {
  childId: string;
  firstName: string;
  bedtimeWeekday: string;
  bedtimeWeekend: string;
  eveningRoutineMinutes: string;
  wakeTime: string;
};

export function DailyRoutinePage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();

  const [wakeTime, setWakeTime] = useState("");
  const [bedTime, setBedTime] = useState("");
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [commuteMinutes, setCommuteMinutes] = useState("");
  const [afterWorkEnergy, setAfterWorkEnergy] = useState("");
  const [childrenDepartureTime, setChildrenDepartureTime] = useState("");
  const [personalPrepMinutes, setPersonalPrepMinutes] = useState("");
  const [morningChildrenDuration, setMorningChildrenDuration] = useState("");
  const [eveningRoutineStart, setEveningRoutineStart] = useState("");
  const [eveningRoutineManager, setEveningRoutineManager] = useState("");
  const [averageEveningRoutineMinutes, setAverageEveningRoutineMinutes] =
    useState("");
  const [preferredFocusMinutes, setPreferredFocusMinutes] = useState("");
  const [mainPriority, setMainPriority] = useState("");
  const [childRoutines, setChildRoutines] = useState<ChildRoutineFormState[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        setLoading(true);
        const [routine, memory] = await Promise.all([
          loadDailyRoutine(user.id),
          loadHouseholdMemoryContext(user.id),
        ]);

        setWakeTime(routine.wakeTime);
        setBedTime(routine.bedTime);
        setWorkDays(routine.workDays);
        setWorkStart(routine.workStart);
        setWorkEnd(routine.workEnd);
        setCommuteMinutes(
          routine.commuteMinutes !== null
            ? String(routine.commuteMinutes)
            : "",
        );
        setAfterWorkEnergy(routine.afterWorkEnergy);
        setChildrenDepartureTime(routine.childrenDepartureTime);
        setPersonalPrepMinutes(
          routine.personalPrepMinutes !== null
            ? String(routine.personalPrepMinutes)
            : "",
        );
        setMorningChildrenDuration(
          routine.morningChildrenDuration !== null
            ? String(routine.morningChildrenDuration)
            : "",
        );
        setEveningRoutineStart(routine.eveningRoutineStart);
        setEveningRoutineManager(routine.eveningRoutineManager);
        setAverageEveningRoutineMinutes(
          routine.averageEveningRoutineMinutes !== null
            ? String(routine.averageEveningRoutineMinutes)
            : "",
        );
        setPreferredFocusMinutes(
          routine.preferredFocusMinutes !== null
            ? String(routine.preferredFocusMinutes)
            : "",
        );
        setMainPriority(routine.mainPriority);

        setChildRoutines(buildChildRoutineForms(memory.children, memory.childRoutines));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger ton quotidien.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user]);

  function toggleWorkDay(value: string) {
    setWorkDays((current) =>
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value],
    );
  }

  function updateChildRoutine(
    childId: string,
    field: keyof Omit<ChildRoutineFormState, "childId" | "firstName">,
    value: string,
  ) {
    setChildRoutines((current) =>
      current.map((item) =>
        item.childId === childId ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setSaving(true);

      await saveDailyRoutine({
        userId: user.id,
        routine: {
          wakeTime,
          bedTime,
          workDays,
          workStart,
          workEnd,
          commuteMinutes: commuteMinutes ? Number(commuteMinutes) : null,
          afterWorkEnergy,
          childrenDepartureTime,
          morningChildrenDuration: morningChildrenDuration
            ? Number(morningChildrenDuration)
            : null,
          personalPrepMinutes: personalPrepMinutes
            ? Number(personalPrepMinutes)
            : null,
          eveningRoutine: [],
          eveningRoutineStart,
          eveningRoutineManager,
          averageEveningRoutineMinutes: averageEveningRoutineMinutes
            ? Number(averageEveningRoutineMinutes)
            : null,
          preferredFocusMinutes: preferredFocusMinutes
            ? Number(preferredFocusMinutes)
            : null,
          mainPriority,
        },
      });

      const routines: ChildRoutineInput[] = childRoutines.map((item) => ({
        childId: item.childId,
        bedtimeWeekday: item.bedtimeWeekday || null,
        bedtimeWeekend: item.bedtimeWeekend || null,
        eveningRoutineMinutes: item.eveningRoutineMinutes
          ? Number(item.eveningRoutineMinutes)
          : null,
        wakeTime: item.wakeTime || null,
      }));

      if (routines.length > 0) {
        await upsertChildRoutinesBatch({ userId: user.id, routines });
      }

      setSuccessMessage(
        "Ton quotidien est enregistré — le planning l’utilisera immédiatement.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer ton quotidien.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>Chargement de ton quotidien...</p>
      </main>
    );
  }

  return (
    <main className="planning-page">
      <section className="planning-container">
        <header className="planning-header">
          <p className="card-label">Mon quotidien</p>
          <h1>Ce qui structure ta journée</h1>
          <p>
            Ces informations alimentent directement le Planning Engine à
            chaque génération.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form routine-form">
          <label>
            <span>Heure de réveil</span>
            <input
              type="time"
              value={wakeTime}
              onChange={(event) => setWakeTime(event.target.value)}
            />
          </label>

          <label>
            <span>Heure de coucher</span>
            <input
              type="time"
              value={bedTime}
              onChange={(event) => setBedTime(event.target.value)}
            />
          </label>

          <fieldset className="routine-fieldset">
            <legend>Jours travaillés</legend>
            <div className="choice-list">
              {WORK_DAY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`choice-button ${workDays.includes(option.value) ? "selected" : ""}`}
                  onClick={() => toggleWorkDay(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>Début du travail</span>
            <input
              type="time"
              value={workStart}
              onChange={(event) => setWorkStart(event.target.value)}
            />
          </label>

          <label>
            <span>Fin du travail</span>
            <input
              type="time"
              value={workEnd}
              onChange={(event) => setWorkEnd(event.target.value)}
            />
          </label>

          <label>
            <span>Temps de trajet (minutes)</span>
            <input
              type="number"
              min={0}
              value={commuteMinutes}
              onChange={(event) => setCommuteMinutes(event.target.value)}
              placeholder="Ex. 25"
            />
          </label>

          <label>
            <span>Énergie après le travail</span>
            <select
              value={afterWorkEnergy}
              onChange={(event) => setAfterWorkEnergy(event.target.value)}
            >
              <option value="">Choisir</option>
              {AFTER_WORK_ENERGY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Départ des enfants</span>
            <input
              type="time"
              value={childrenDepartureTime}
              onChange={(event) =>
                setChildrenDepartureTime(event.target.value)
              }
            />
          </label>

          <label>
            <span>Préparation personnelle (minutes)</span>
            <input
              type="number"
              min={0}
              max={120}
              value={personalPrepMinutes}
              onChange={(event) => setPersonalPrepMinutes(event.target.value)}
              placeholder="Ex. 20"
            />
          </label>

          <label>
            <span>Préparation des enfants (minutes)</span>
            <input
              type="number"
              min={0}
              value={morningChildrenDuration}
              onChange={(event) =>
                setMorningChildrenDuration(event.target.value)
              }
              placeholder="Ex. 45"
            />
          </label>
          <p className="profile-section-hint">
            Le petit déjeuner se configure dans la section Repas — il est distinct de la préparation des enfants.
          </p>

          <fieldset className="routine-fieldset">
            <legend>Routine du soir — foyer</legend>

            <label>
              <span>Début habituel de la routine du soir</span>
              <input
                type="time"
                value={eveningRoutineStart}
                onChange={(event) =>
                  setEveningRoutineStart(event.target.value)
                }
              />
            </label>

            <label>
              <span>Durée moyenne de la routine (minutes)</span>
              <input
                type="number"
                min={0}
                value={averageEveningRoutineMinutes}
                onChange={(event) =>
                  setAverageEveningRoutineMinutes(event.target.value)
                }
                placeholder="Ex. 60"
              />
            </label>

            <label>
              <span>Personne qui gère habituellement la routine</span>
              <input
                type="text"
                value={eveningRoutineManager}
                onChange={(event) =>
                  setEveningRoutineManager(event.target.value)
                }
                placeholder="Ex. Madeline"
              />
            </label>
          </fieldset>

          {childRoutines.length > 0 && (
            <fieldset className="routine-fieldset">
              <legend>Heures de coucher par enfant</legend>

              {childRoutines.map((child) => (
                <div className="child-routine-card" key={child.childId}>
                  <h3>{child.firstName}</h3>

                  <label>
                    <span>Coucher en semaine</span>
                    <input
                      type="time"
                      value={child.bedtimeWeekday}
                      onChange={(event) =>
                        updateChildRoutine(
                          child.childId,
                          "bedtimeWeekday",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Coucher week-end (facultatif)</span>
                    <input
                      type="time"
                      value={child.bedtimeWeekend}
                      onChange={(event) =>
                        updateChildRoutine(
                          child.childId,
                          "bedtimeWeekend",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Durée routine du soir (minutes)</span>
                    <input
                      type="number"
                      min={0}
                      value={child.eveningRoutineMinutes}
                      onChange={(event) =>
                        updateChildRoutine(
                          child.childId,
                          "eveningRoutineMinutes",
                          event.target.value,
                        )
                      }
                      placeholder="Ex. 45"
                    />
                  </label>

                  <label>
                    <span>Heure de réveil (facultatif)</span>
                    <input
                      type="time"
                      value={child.wakeTime}
                      onChange={(event) =>
                        updateChildRoutine(
                          child.childId,
                          "wakeTime",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </fieldset>
          )}

          <label>
            <span>Durée idéale de concentration</span>
            <select
              value={preferredFocusMinutes}
              onChange={(event) =>
                setPreferredFocusMinutes(event.target.value)
              }
            >
              <option value="">Choisir</option>
              {FOCUS_DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Priorité principale</span>
            <select
              value={mainPriority}
              onChange={(event) => setMainPriority(event.target.value)}
            >
              <option value="">Choisir</option>
              {MAIN_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {user && <MealSettingsSection userId={user.id} />}

          {errorMessage && (
            <div className="message message-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          <Button type="submit" loading={saving} disabled={saving}>
            Enregistrer mon quotidien
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => goToRoute(AppRoutes.FAMILY_CONTEXT)}
          >
            Contexte familial
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => goToRoute(AppRoutes.HOME)}
          >
            Retour accueil
          </Button>
        </form>
      </section>
    </main>
  );
}

function buildChildRoutineForms(
  children: ChildRecord[],
  routines: Array<{
    child_id: string;
    bedtime_weekday: string | null;
    bedtime_weekend: string | null;
    evening_routine_minutes: number | null;
    wake_time: string | null;
  }>,
): ChildRoutineFormState[] {
  return children.map((child) => {
    const routine = routines.find((item) => item.child_id === child.id);

    return {
      childId: child.id,
      firstName: child.first_name,
      bedtimeWeekday: routine?.bedtime_weekday ?? "",
      bedtimeWeekend: routine?.bedtime_weekend ?? "",
      eveningRoutineMinutes:
        routine?.evening_routine_minutes !== null &&
        routine?.evening_routine_minutes !== undefined
          ? String(routine.evening_routine_minutes)
          : "",
      wakeTime: routine?.wake_time ?? "",
    };
  });
}

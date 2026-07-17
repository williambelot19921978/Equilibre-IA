import { Button } from "../ui/Button";
import { useWorkScheduleEditor } from "../../hooks/useWorkScheduleEditor";
import { extractWorkDaysFromFacts } from "../../lib/profile/extractWorkDays";
import { getMondayOfWeek } from "../../lib/work/workScheduleCycle";
import type { ProfileFactRecord } from "../../types";
import {
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
  emptyWeekPattern,
  type WeekdayKey,
  type WorkSchedulePatternData,
} from "../../types/workSchedule";
import type { ScheduleMode } from "../../lib/work/workScheduleEditorState";

type WorkScheduleSectionProps = {
  userId: string;
  facts: ProfileFactRecord[];
  workStart?: string;
  workEnd?: string;
  commuteMinutes?: number;
};

function toggleDayWork(
  week: WorkSchedulePatternData["weeklyPatterns"][0],
  day: WeekdayKey,
  work: boolean,
): WorkSchedulePatternData["weeklyPatterns"][0] {
  return {
    ...week,
    days: {
      ...week.days,
      [day]: {
        ...week.days[day],
        work,
        startTime: week.days[day]?.startTime,
        endTime: week.days[day]?.endTime,
      },
    },
  };
}

function WeekEditor({
  week,
  label,
  defaultStart,
  defaultEnd,
  onChange,
}: {
  week: WorkSchedulePatternData["weeklyPatterns"][0];
  label: string;
  defaultStart: string;
  defaultEnd: string;
  onChange: (week: WorkSchedulePatternData["weeklyPatterns"][0]) => void;
}) {
  return (
    <div className="work-schedule-week-grid">
      <h4>{label}</h4>
      {WEEKDAY_KEYS.map((day) => {
        const entry = week.days[day] ?? { work: false };
        return (
          <div className="work-schedule-day-row" key={day}>
            <span>{WEEKDAY_LABELS[day]}</span>
            <label className="work-schedule-day-toggle">
              <input
                type="checkbox"
                checked={entry.work}
                onChange={(event) =>
                  onChange(toggleDayWork(week, day, event.target.checked))
                }
              />
              {entry.work ? "Travail" : "Repos"}
            </label>
            {entry.work && (
              <>
                <input
                  type="time"
                  value={entry.startTime ?? defaultStart}
                  onChange={(event) =>
                    onChange({
                      ...week,
                      days: {
                        ...week.days,
                        [day]: { ...entry, startTime: event.target.value },
                      },
                    })
                  }
                />
                <input
                  type="time"
                  value={entry.endTime ?? defaultEnd}
                  onChange={(event) =>
                    onChange({
                      ...week,
                      days: {
                        ...week.days,
                        [day]: { ...entry, endTime: event.target.value },
                      },
                    })
                  }
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WorkScheduleSection({
  userId,
  facts,
  workStart = "09:00",
  workEnd = "17:00",
  commuteMinutes,
}: WorkScheduleSectionProps) {
  const workDays = extractWorkDaysFromFacts(facts);
  const {
    state,
    setState,
    setMode,
    preview,
    loaded,
    saving,
    message,
    error,
    save,
  } = useWorkScheduleEditor({
    userId,
    workDays,
    workStart,
    workEnd,
    commuteMinutes,
  });

  if (!loaded) {
    return <p>Chargement du rythme de travail…</p>;
  }

  return (
    <section className="work-schedule-section" aria-labelledby="work-schedule-title">
      <h3 id="work-schedule-title">Mon rythme de travail</h3>
      <p className="profile-section-hint">
        Configure des semaines fixes, alternées ou un cycle personnalisé. Le
        calendrier et le planning utiliseront exactement ce rythme.
      </p>

      <fieldset className="work-schedule-mode-picker">
        <legend className="sr-only">Type de rythme</legend>
        {(
          [
            ["fixed_week", "Horaires identiques chaque semaine"],
            ["alternating_weeks", "Semaines alternées (A / B)"],
            ["cycle", "Cycle personnalisé (2 à 4 semaines)"],
          ] as Array<[ScheduleMode, string]>
        ).map(([value, label]) => (
          <label key={value} className="work-schedule-mode-option">
            <input
              type="radio"
              name={`schedule-mode-${userId}`}
              value={value}
              checked={state.mode === value}
              onChange={() => setMode(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <label className="work-schedule-field">
        Semaine de référence (lundi)
        <input
          type="date"
          value={state.referenceWeek}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              referenceWeek: getMondayOfWeek(event.target.value),
            }))
          }
        />
      </label>

      {state.mode === "fixed_week" && (
        <WeekEditor
          week={state.weekA}
          label="Semaine habituelle"
          defaultStart={workStart}
          defaultEnd={workEnd}
          onChange={(week) =>
            setState((current) => ({ ...current, weekA: week }))
          }
        />
      )}

      {state.mode === "alternating_weeks" && (
        <>
          <WeekEditor
            week={state.weekA}
            label="Semaine A"
            defaultStart={workStart}
            defaultEnd={workEnd}
            onChange={(week) =>
              setState((current) => ({ ...current, weekA: week }))
            }
          />
          <WeekEditor
            week={state.weekB}
            label="Semaine B"
            defaultStart={workStart}
            defaultEnd={workEnd}
            onChange={(week) =>
              setState((current) => ({ ...current, weekB: week }))
            }
          />
        </>
      )}

      {state.mode === "cycle" && (
        <>
          <label className="work-schedule-field">
            Nombre de semaines dans le cycle
            <select
              value={state.cycleWeeks.length}
              onChange={(event) => {
                const count = Number(event.target.value);
                setState((current) => {
                  const next = [...current.cycleWeeks];
                  while (next.length < count) {
                    next.push(emptyWeekPattern(`Semaine ${next.length + 1}`));
                  }
                  return { ...current, cycleWeeks: next.slice(0, count) };
                });
              }}
            >
              <option value={2}>2 semaines</option>
              <option value={3}>3 semaines</option>
              <option value={4}>4 semaines</option>
            </select>
          </label>
          {state.cycleWeeks.map((week, index) => (
            <WeekEditor
              key={`cycle-week-${index}`}
              week={week}
              label={week.label ?? `Semaine ${index + 1}`}
              defaultStart={workStart}
              defaultEnd={workEnd}
              onChange={(updated) =>
                setState((current) => ({
                  ...current,
                  cycleWeeks: current.cycleWeeks.map((item, i) =>
                    i === index ? updated : item,
                  ),
                }))
              }
            />
          ))}
        </>
      )}

      <fieldset className="work-schedule-compensatory">
        <legend>Repos compensateur (facultatif)</legend>
        <label className="work-schedule-field">
          Quand je travaille un
          <select
            value={state.compensatoryWhen}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                compensatoryWhen: event.target.value as WeekdayKey,
              }))
            }
          >
            {WEEKDAY_KEYS.map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABELS[day]}
              </option>
            ))}
          </select>
        </label>
        <label className="work-schedule-field">
          Mon repos compensateur est le
          <select
            value={state.compensatoryDay}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                compensatoryDay: event.target.value as WeekdayKey,
              }))
            }
          >
            {WEEKDAY_KEYS.map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABELS[day]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="work-schedule-preview">
        <strong>Sur les six prochaines semaines</strong>
        <div className="work-schedule-preview-grid">
          {preview.map(({ date, status }) => {
            const dayNum = new Date(`${date}T12:00:00`).getDate();
            const cellClass = status.isWorkDay
              ? "work"
              : status.isCompensatoryRest
                ? "compensatory"
                : status.isWeekendNonWork
                  ? "weekend"
                  : "rest";
            return (
              <span
                key={date}
                className={`work-schedule-preview-cell ${cellClass}`}
                title={`${date} — ${status.reason}`}
              >
                {dayNum}
              </span>
            );
          })}
        </div>
      </div>

      {error && <div className="message message-error">{error}</div>}
      {message && <div className="message message-success">{message}</div>}

      <Button loading={saving} onClick={() => void save()}>
        Enregistrer mon rythme
      </Button>
    </section>
  );
}

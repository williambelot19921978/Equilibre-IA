import { useState, type FormEvent } from "react";

import { Button } from "../ui/Button";
import { ChildcareModeSelector } from "./ChildcareModeSelector";
import { createFamilyContextPeriod } from "../../services/familyContextService";
import type { ChildcareMode } from "../../types/childcare";
import type { FamilyContextType } from "../../types/familyContext";

type VacationWho = "me" | "children" | "family";

const RHYTHM_OPTIONS = [
  { label: "Repos", value: "repos" },
  { label: "Famille", value: "famille" },
  { label: "Révisions", value: "revisions" },
  { label: "Sport", value: "sport" },
  { label: "Équilibré", value: "equilibre" },
] as const;

type VacationQuickFormProps = {
  userId: string;
  onClose: () => void;
  onSaved?: () => void;
};

function mapWhoToContextType(who: VacationWho): FamilyContextType {
  if (who === "children") return "children_vacation";
  return "user_vacation";
}

export function VacationQuickForm({
  userId,
  onClose,
  onSaved,
}: VacationQuickFormProps) {
  const [who, setWho] = useState<VacationWho>("me");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [keepConstraints, setKeepConstraints] = useState(false);
  const [rhythm, setRhythm] = useState<(typeof RHYTHM_OPTIONS)[number]["value"]>("equilibre");
  const [childcareMode, setChildcareMode] =
    useState<ChildcareMode>("home_with_me");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Les dates de début et de fin sont obligatoires.");
      return;
    }

    const startsAt = new Date(`${startDate}T00:00:00`).toISOString();
    const endsAt = new Date(`${endDate}T23:59:00`).toISOString();

    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError("La date de fin doit être après le début.");
      return;
    }

    try {
      setSaving(true);

      await createFamilyContextPeriod({
        userId,
        period: {
          contextType: mapWhoToContextType(who),
          title:
            who === "family"
              ? "Vacances famille"
              : who === "children"
                ? "Vacances enfants"
                : "Mes vacances",
          startsAt,
          endsAt,
          userId: who === "children" ? null : userId,
          description:
            [description.trim(), `Rythme : ${rhythm}`].filter(Boolean).join(" — ") ||
            null,
          impact:
            who === "family"
              ? {
                  disableWork: true,
                  disableSchoolDeparture: true,
                  maxFillRatio: keepConstraints ? 0.5 : 0.4,
                }
              : who === "me"
                ? {
                    disableWork: true,
                    maxFillRatio: keepConstraints ? 0.5 : 0.4,
                  }
                : {
                    disableSchoolDeparture: true,
                    maxFillRatio: 0.5,
                    childcareMode,
                  },
        },
      });

      onSaved?.();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d’enregistrer les vacances.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card vacation-form-modal"
        role="dialog"
        aria-labelledby="vacation-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="card-label">Vacances</p>
            <h2 id="vacation-form-title">Ajouter une période de vacances</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <form className="vacation-form" onSubmit={(event) => void handleSubmit(event)}>
          <fieldset>
            <legend>Qui est en vacances ?</legend>
            <label>
              <input type="radio" checked={who === "me"} onChange={() => setWho("me")} />
              Moi
            </label>
            <label>
              <input type="radio" checked={who === "children"} onChange={() => setWho("children")} />
              Les enfants
            </label>
            <label>
              <input type="radio" checked={who === "family"} onChange={() => setWho("family")} />
              Toute la famille
            </label>
          </fieldset>

          {who === "children" && (
            <ChildcareModeSelector
              value={childcareMode}
              onChange={setChildcareMode}
              idPrefix="vacation-quick"
            />
          )}

          <label>
            Date de début
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Date de fin
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
          <label>
            Description (facultatif)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <label>
            Rythme souhaité
            <select value={rhythm} onChange={(e) => setRhythm(e.target.value as typeof rhythm)}>
              {RHYTHM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="edit-block-checkbox">
            <input
              type="checkbox"
              checked={keepConstraints}
              onChange={(e) => setKeepConstraints(e.target.checked)}
            />
            Conserver certaines contraintes habituelles
          </label>

          {error && <div className="message message-error">{error}</div>}

          <footer className="modal-footer">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" fullWidth loading={saving}>
              Enregistrer les vacances
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

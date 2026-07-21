import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../ui/Button";
import {
  GOAL_CATEGORIES,
  GOAL_IMPORTANCE_OPTIONS,
} from "../../lib/goals/goalCategories";
import type {
  CreateGoalInput,
  GoalImportance,
  UserGoal,
} from "../../types/goal";

type GoalFormProps = {
  initialGoal?: UserGoal | null;
  saving?: boolean;
  onSubmit: (input: CreateGoalInput) => void;
  onCancel?: () => void;
};

export function GoalForm({
  initialGoal = null,
  saving = false,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("studies");
  const [targetDate, setTargetDate] = useState("");
  const [importance, setImportance] = useState<GoalImportance>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  useEffect(() => {
    if (!initialGoal) {
      setName("");
      setCategory("studies");
      setTargetDate("");
      setImportance("medium");
      setEstimatedMinutes("");
      return;
    }

    setName(initialGoal.name);
    setCategory(initialGoal.category);
    setTargetDate(initialGoal.targetDate?.slice(0, 10) ?? "");
    setImportance(initialGoal.importance);
    setEstimatedMinutes(
      initialGoal.estimatedMinutes != null
        ? String(initialGoal.estimatedMinutes)
        : "",
    );
  }, [initialGoal]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const minutes = estimatedMinutes.trim()
      ? Number(estimatedMinutes)
      : null;

    onSubmit({
      name,
      category,
      targetDate: targetDate || null,
      importance,
      estimatedMinutes:
        minutes != null && Number.isFinite(minutes) && minutes > 0
          ? minutes
          : null,
    });
  }

  return (
    <form className="auth-form goal-form" onSubmit={handleSubmit}>
      <label>
        <span>Nom de l&apos;objectif</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex. Préparer la certification de naturopathie"
          required
        />
      </label>

      <div className="task-form-grid">
        <label>
          <span>Catégorie</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {GOAL_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Importance</span>
          <select
            value={importance}
            onChange={(event) =>
              setImportance(event.target.value as GoalImportance)
            }
          >
            {GOAL_IMPORTANCE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="task-form-grid">
        <label>
          <span>Date cible, facultative</span>
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
          />
        </label>

        <label>
          <span>Estimation globale (minutes), facultative</span>
          <input
            type="number"
            min="15"
            step="15"
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(event.target.value)}
            placeholder="Ex. 1200"
          />
        </label>
      </div>

      <div className="goal-form-actions">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {initialGoal ? "Enregistrer" : "Créer l'objectif"}
        </Button>
      </div>
    </form>
  );
}

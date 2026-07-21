import { useState } from "react";

import { Button } from "../ui/Button";
import type { TaskRecord } from "../../services/tasksService";
import type { GoalStep, UserGoal } from "../../types/goal";

type GoalStepsEditorProps = {
  goal: UserGoal;
  tasks: TaskRecord[];
  onAddStep: (title: string) => void;
  onUpdateStep: (
    stepId: string,
    patch: { title?: string; taskIds?: string[] },
  ) => void;
  onRemoveStep: (stepId: string) => void;
};

function getTaskLabel(task: TaskRecord): string {
  const status =
    task.status === "done"
      ? " (terminée)"
      : task.status === "cancelled"
        ? " (annulée)"
        : "";
  return `${task.title}${status}`;
}

export function GoalStepsEditor({
  goal,
  tasks,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
}: GoalStepsEditorProps) {
  const [newStepTitle, setNewStepTitle] = useState("");

  function handleAddStep() {
    const title = newStepTitle.trim();
    if (!title) return;
    onAddStep(title);
    setNewStepTitle("");
  }

  function toggleTaskLink(step: GoalStep, taskId: string) {
    const linked = step.taskIds.includes(taskId);
    const taskIds = linked
      ? step.taskIds.filter((id) => id !== taskId)
      : [...step.taskIds, taskId];

    onUpdateStep(step.id, { taskIds });
  }

  return (
    <div className="goal-steps-editor">
      <p className="card-label">Étapes</p>
      <p className="goal-steps-hint">
        Découpe ton objectif en étapes, puis lie des tâches existantes à chaque
        étape.
      </p>

      {goal.steps.length === 0 && (
        <p className="goal-empty-steps">Aucune étape pour l&apos;instant.</p>
      )}

      <ol className="goal-steps-list">
        {goal.steps.map((step) => (
          <li key={step.id} className="goal-step-item">
            <div className="goal-step-header">
              <strong>{step.title}</strong>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveStep(step.id)}
              >
                Supprimer
              </Button>
            </div>

            {tasks.length === 0 ? (
              <p className="goal-step-no-tasks">
                Crée des tâches dans l&apos;écran Tâches pour les lier ici.
              </p>
            ) : (
              <ul className="goal-step-tasks">
                {tasks.map((task) => {
                  const checked = step.taskIds.includes(task.id);
                  return (
                    <li key={task.id}>
                      <label className="goal-task-link">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTaskLink(step, task.id)}
                        />
                        <span>{getTaskLabel(task)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <div className="goal-add-step">
        <input
          type="text"
          value={newStepTitle}
          onChange={(event) => setNewStepTitle(event.target.value)}
          placeholder="Ex. Module 1"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAddStep();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={handleAddStep}>
          Ajouter une étape
        </Button>
      </div>
    </div>
  );
}

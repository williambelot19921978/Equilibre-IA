import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { GoalProgressAssistant } from "../components/goals/GoalProgressAssistant";
import { GoalForm } from "../components/goals/GoalForm";
import { GoalProgressBar } from "../components/goals/GoalProgressBar";
import { GoalStepsEditor } from "../components/goals/GoalStepsEditor";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoals } from "../hooks/useGoals";
import { useGoalProgressAssistant } from "../hooks/useGoalProgressAssistant";
import { getGoalCategoryLabel } from "../lib/goals/goalCategories";
import { computeGoalProgress } from "../lib/goals/computeGoalProgress";
import type { UserGoal } from "../types/goal";

function formatTargetDate(value: string | null): string {
  if (!value) return "Pas de date cible";

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatImportance(value: UserGoal["importance"]): string {
  if (value === "high") return "Élevée";
  if (value === "low") return "Faible";
  return "Normale";
}

export function GoalsPage() {
  useAppPageTitle("Objectifs");
  const { user } = useAuth();
  const { goToResolvedRoute, goToRoute, AppRoutes } = useAppNavigation();
  const {
    enabled,
    goals,
    tasks,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    addStep,
    updateStep,
    removeStep,
  } = useGoals(user?.id);

  const assistant = useGoalProgressAssistant({ goals, tasks });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  );

  const editingGoal = useMemo(
    () => goals.find((goal) => goal.id === editingGoalId) ?? null,
    [goals, editingGoalId],
  );

  if (!enabled) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  function clearMessages() {
    setSuccessMessage("");
    setLocalError("");
  }

  function handleCreateGoal(input: Parameters<typeof createGoal>[0]) {
    clearMessages();
    const goal = createGoal(input);
    if (!goal) {
      setLocalError("Impossible de créer l'objectif.");
      return;
    }

    setShowCreateForm(false);
    setSelectedGoalId(goal.id);
    setSuccessMessage("Objectif créé.");
  }

  function handleUpdateGoal(input: Parameters<typeof createGoal>[0]) {
    if (!editingGoalId) return;

    clearMessages();
    const goal = updateGoal(editingGoalId, input);
    if (!goal) {
      setLocalError("Impossible de modifier l'objectif.");
      return;
    }

    setEditingGoalId(null);
    setSuccessMessage("Objectif mis à jour.");
  }

  function handleDeleteGoal(goalId: string) {
    clearMessages();
    const deleted = deleteGoal(goalId);
    if (!deleted) {
      setLocalError("Impossible de supprimer l'objectif.");
      return;
    }

    if (selectedGoalId === goalId) setSelectedGoalId(null);
    if (editingGoalId === goalId) setEditingGoalId(null);
    setSuccessMessage("Objectif supprimé.");
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">Aura</p>
            <h1>Objectifs</h1>
            <p>
              Définis un objectif, découpe-le en étapes, puis relie tes tâches
              existantes pour suivre ta progression.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void goToResolvedRoute()}
          >
            Retour
          </Button>
        </header>

        {(error || localError) && (
          <p className="form-error" role="alert">
            {error || localError}
          </p>
        )}

        {successMessage && (
          <div className="message message-success" role="status">
            {successMessage}
          </div>
        )}

        {assistant.enabled && assistant.primaryNextAction && (
          <GoalProgressAssistant
            nextAction={assistant.primaryNextAction}
            onPlan={() => goToRoute(AppRoutes.PLANNING)}
          />
        )}

        <section className="goal-toolbar">
          <Button
            type="button"
            onClick={() => {
              clearMessages();
              setShowCreateForm((value) => !value);
              setEditingGoalId(null);
            }}
          >
            {showCreateForm ? "Fermer le formulaire" : "Créer un objectif"}
          </Button>
        </section>

        {showCreateForm && (
          <section className="task-form-card goal-form-card">
            <p className="card-label">Nouvel objectif</p>
            <h2>Que veux-tu accomplir ?</h2>
            <GoalForm
              saving={loading}
              onSubmit={handleCreateGoal}
              onCancel={() => setShowCreateForm(false)}
            />
          </section>
        )}

        {loading ? (
          <p>Chargement des objectifs…</p>
        ) : goals.length === 0 ? (
          <EmptyState
            aura="empty"
            title="Aucun objectif pour l'instant"
            description="Commence par en créer un, puis ajoute des étapes manuellement."
            primaryAction={
              !showCreateForm
                ? { label: "Créer un objectif", onClick: () => setShowCreateForm(true) }
                : undefined
            }
          />
        ) : (
          <div className="goals-layout">
            <section className="goals-list" aria-label="Liste des objectifs">
              {goals.map((goal) => {
                const progress = computeGoalProgress(goal, tasks);
                const isSelected = goal.id === selectedGoalId;

                return (
                  <article
                    key={goal.id}
                    className={`goal-card${isSelected ? " goal-card-selected" : ""}`}
                  >
                    <button
                      type="button"
                      className="goal-card-select"
                      onClick={() => {
                        clearMessages();
                        setSelectedGoalId(goal.id);
                        setEditingGoalId(null);
                      }}
                    >
                      <h2>{goal.name}</h2>
                      <p className="goal-card-meta">
                        {getGoalCategoryLabel(goal.category)} ·{" "}
                        {formatImportance(goal.importance)}
                      </p>
                      <GoalProgressBar
                        percent={progress.percent}
                        completedTasks={progress.completedTasks}
                        totalTasks={progress.totalTasks}
                      />
                    </button>
                  </article>
                );
              })}
            </section>

            {selectedGoal && (
              <section className="goal-detail task-form-card">
                <header className="goal-detail-header">
                  <div>
                    <p className="card-label">Détail</p>
                    <h2>{selectedGoal.name}</h2>
                    <p className="goal-detail-meta">
                      {getGoalCategoryLabel(selectedGoal.category)} ·{" "}
                      {formatTargetDate(selectedGoal.targetDate)} · Importance{" "}
                      {formatImportance(selectedGoal.importance)}
                    </p>
                  </div>
                  <div className="goal-detail-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        clearMessages();
                        setEditingGoalId(selectedGoal.id);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(selectedGoal.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </header>

                {editingGoal && editingGoal.id === selectedGoal.id ? (
                  <GoalForm
                    initialGoal={editingGoal}
                    onSubmit={handleUpdateGoal}
                    onCancel={() => setEditingGoalId(null)}
                  />
                ) : (
                  <>
                    <GoalProgressBar
                      percent={
                        computeGoalProgress(selectedGoal, tasks).percent
                      }
                      completedTasks={
                        computeGoalProgress(selectedGoal, tasks).completedTasks
                      }
                      totalTasks={
                        computeGoalProgress(selectedGoal, tasks).totalTasks
                      }
                    />

                    <GoalStepsEditor
                      goal={selectedGoal}
                      tasks={tasks}
                      onAddStep={(title) => {
                        clearMessages();
                        addStep(selectedGoal.id, title);
                        setSuccessMessage("Étape ajoutée.");
                      }}
                      onUpdateStep={(stepId, patch) => {
                        clearMessages();
                        updateStep(selectedGoal.id, stepId, patch);
                        setSuccessMessage("Étape mise à jour.");
                      }}
                      onRemoveStep={(stepId) => {
                        clearMessages();
                        removeStep(selectedGoal.id, stepId);
                        setSuccessMessage("Étape supprimée.");
                      }}
                    />
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import {
  clearHouseholdTaskCollaborationDraft,
  readHouseholdTaskCollaborationDraft,
} from "../lib/householdCollaboration/householdCollaborationDraftStorage";

import {
  createTask,
  getUserTasks,
  incrementTaskSkipCount,
  updateTaskStatus,
  type TaskRecord,
} from "../services/tasksService";

const categories = [
  { value: "family", label: "Famille" },
  { value: "children", label: "Enfants" },
  { value: "studies", label: "Études ou formation" },
  { value: "work", label: "Travail" },
  { value: "home", label: "Maison" },
  { value: "sport", label: "Sport" },
  { value: "rest", label: "Repos" },
  { value: "personal", label: "Temps personnel" },
  { value: "spirituality", label: "Spiritualité" },
  { value: "other", label: "Autre" },
];

function getCategoryLabel(value: string): string {
  return categories.find((category) => category.value === value)?.label ?? value;
}

function getPriorityLabel(priority: number) {
  if (priority >= 5) return "Très importante";
  if (priority === 4) return "Importante";
  if (priority === 3) return "Normale";
  if (priority === 2) return "Secondaire";
  return "Faible";
}

function formatDueDate(value: string | null) {
  if (!value) return "Pas d’échéance";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TasksPage() {
  const { goToResolvedRoute } = useAppNavigation();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("studies");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("3");
  const [splittable, setSplittable] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [collaborationDraftLoaded, setCollaborationDraftLoaded] = useState(false);

  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "done" &&
          task.status !== "cancelled",
      ),
    [tasks],
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done"),
    [tasks],
  );

  useEffect(() => {
    async function loadTasks() {
      if (!user) return;

      try {
        setLoading(true);
        const loadedTasks = await getUserTasks(user.id);
        setTasks(loadedTasks);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les tâches.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTasks();
  }, [user]);

  useEffect(() => {
    const draft = readHouseholdTaskCollaborationDraft();
    if (!draft) return;

    setTitle(draft.title);
    setDescription(draft.description);
    setCategory(draft.category);
    setEstimatedMinutes(String(draft.estimatedMinutes));
    setPriority(String(draft.priority));
    setSplittable(draft.splittable);
    if (draft.dueDate) {
      setDueAt(`${draft.dueDate}T12:00`);
    }
    setCollaborationDraftLoaded(true);
  }, []);

  function dismissCollaborationDraft() {
    clearHouseholdTaskCollaborationDraft();
    setCollaborationDraftLoaded(false);
  }

  async function handleCreateTask(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user) return;

    setErrorMessage("");
    setSuccessMessage("");

    const duration = Number(estimatedMinutes);
    const numericPriority = Number(priority);

    if (!title.trim()) {
      setErrorMessage("Donne un nom à la tâche.");
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setErrorMessage("Indique une durée valide.");
      return;
    }

    try {
      setSaving(true);

      const newTask = await createTask({
        userId: user.id,
        title,
        description,
        category,
        estimatedMinutes: duration,
        dueAt: dueAt || undefined,
        priority: numericPriority,
        splittable,
      });

      setTasks((current) => [newTask, ...current]);

      setTitle("");
      setDescription("");
      setCategory("studies");
      setEstimatedMinutes("30");
      setDueAt("");
      setPriority("3");
      setSplittable(true);

      clearHouseholdTaskCollaborationDraft();
      setCollaborationDraftLoaded(false);

      setSuccessMessage("Tâche ajoutée avec succès.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’ajouter la tâche.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(task: TaskRecord) {
    try {
      await updateTaskStatus({
        taskId: task.id,
        status: "done",
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, status: "done" }
            : item,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de terminer la tâche.",
      );
    }
  }

  async function handleSkip(task: TaskRecord) {
    try {
      setErrorMessage("");

      const updatedTask = await incrementTaskSkipCount(task);

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? updatedTask : item,
        ),
      );

      setSuccessMessage(
        `Tâche reportée ${updatedTask.skip_count} fois.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de reporter la tâche.",
      );
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">Aura</p>
            <h1>Mes tâches</h1>
            <p>
              Ajoute ce que tu dois faire. Le futur planning
              intelligent utilisera ces informations.
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

        {collaborationDraftLoaded && (
          <section className="household-collaboration-prefill-banner">
            <div>
              <p className="card-label">Suggestion du foyer</p>
              <h2>Brouillon préparé</h2>
              <p>
                Un brouillon de tâche collaborative a été préparé — validez ou
                modifiez le formulaire ci-dessous avant de créer la tâche.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={dismissCollaborationDraft}>
              Compris
            </Button>
          </section>
        )}

        <section className="task-form-card">
          <p className="card-label">Nouvelle tâche</p>
          <h2>Que dois-tu faire ?</h2>

          <form
            className="auth-form"
            onSubmit={handleCreateTask}
          >
            <label>
              <span>Nom de la tâche</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Terminer le module de phytothérapie"
                required
              />
            </label>

            <label>
              <span>Description, facultative</span>
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Ajoute quelques précisions..."
                rows={3}
              />
            </label>

            <div className="task-form-grid">
              <label>
                <span>Catégorie</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  {categories.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Durée estimée</span>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(event) =>
                    setEstimatedMinutes(event.target.value)
                  }
                  required
                />
              </label>
            </div>

            <div className="task-form-grid">
              <label>
                <span>Échéance, facultative</span>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) =>
                    setDueAt(event.target.value)
                  }
                />
              </label>

              <label>
                <span>Importance</span>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                >
                  <option value="1">Faible</option>
                  <option value="2">Secondaire</option>
                  <option value="3">Normale</option>
                  <option value="4">Importante</option>
                  <option value="5">Très importante</option>
                </select>
              </label>
            </div>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={splittable}
                onChange={(event) =>
                  setSplittable(event.target.checked)
                }
              />

              <span>
                Cette tâche peut être découpée en plusieurs petites
                séances.
              </span>
            </label>

            {errorMessage && (
              <div className="message message-error">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="message message-success">
                {successMessage}
              </div>
            )}

            <Button type="submit" loading={saving} disabled={saving}>
              Ajouter intelligemment
            </Button>
          </form>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="card-label">À organiser</p>
              <h2>{activeTasks.length} tâche(s)</h2>
            </div>
          </div>

          {loading ? (
            <p>Chargement des tâches...</p>
          ) : activeTasks.length === 0 ? (
            <EmptyState
              aura="empty"
              title="Aucune tâche en attente"
              description="Ajoute ta première tâche avec le formulaire ci-dessus."
            />
          ) : (
            <div className="task-list">
              {activeTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-card-header">
                    <div>
                      <span className="task-category">
                        {getCategoryLabel(task.category)}
                      </span>
                      <h3>{task.title}</h3>
                    </div>

                    <span className="task-priority">
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  <div className="task-meta">
                    <span>
                      ⏱️ {task.estimated_minutes ?? "?"} min
                    </span>
                    <span>📅 {formatDueDate(task.due_at)}</span>
                    <span>
                      ↩️ {task.skip_count} report(s)
                    </span>
                  </div>

                  {task.skip_count >= 3 && (
                    <div className="task-warning">
                      Cette tâche a été évitée plusieurs fois. Le
                      coach proposera bientôt une version plus petite.
                    </div>
                  )}

                  <div className="task-actions">
                    <Button
                      type="button"
                      onClick={() => handleComplete(task)}
                    >
                      Terminer
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleSkip(task)}
                    >
                      Reporter
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {completedTasks.length > 0 && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="card-label">Terminé</p>
                <h2>{completedTasks.length} tâche(s)</h2>
              </div>
            </div>

            <div className="task-list completed-task-list">
              {completedTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <h3>{task.title}</h3>
                  <p>Tâche terminée ✅</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
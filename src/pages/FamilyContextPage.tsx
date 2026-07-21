import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ChildcareModeSelector } from "../components/family/ChildcareModeSelector";
import {
  formatActiveContextBanner,
  getContextTypeLabel,
} from "../ai/familyContextEngine";
import { getChildcareModeLabel } from "../types/childcare";
import { FAMILY_CONTEXT_TYPE_OPTIONS } from "../config/familyContextOptions";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import {
  cancelFamilyContextPeriod,
  createFamilyContextPeriod,
  deleteFamilyContextPeriod,
  loadActiveAndFuturePeriods,
  updateFamilyContextPeriod,
} from "../services/familyContextService";
import {
  getCurrentHouseholdId,
  getHouseholdMembers,
} from "../services/householdService";
import { getChildrenByHousehold } from "../services/childrenService";
import type { ChildRecord, HouseholdMemberRecord } from "../types";
import type {
  FamilyContextPeriodRecord,
  FamilyContextType,
} from "../types/familyContext";
import type { ChildcareMode } from "../types/childcare";

function formatPeriodRange(period: FamilyContextPeriodRecord): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(period.starts_at))} → ${formatter.format(new Date(period.ends_at))}`;
}

function combineDateTime(
  date: string,
  time: string,
  fallback: "start" | "end",
): string {
  const resolvedTime = time || (fallback === "start" ? "00:00" : "23:59");
  return new Date(`${date}T${resolvedTime}:00`).toISOString();
}

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function isoToTimeInput(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function suggestTitle({
  contextType,
  userId,
  members,
}: {
  contextType: FamilyContextType;
  userId: string | null;
  members: HouseholdMemberRecord[];
}): string {
  const memberName = userId
    ? members.find((member) => member.user_id === userId)?.display_name
    : null;

  if (contextType === "work_travel" && memberName) {
    return `${memberName} en déplacement`;
  }

  if (contextType === "solo_parent") {
    return "Seule avec les enfants";
  }

  if (contextType === "user_vacation") {
    return "Vacances familiales";
  }

  if (contextType === "children_vacation") {
    return "Vacances des enfants";
  }

  return getContextTypeLabel(contextType);
}

export function FamilyContextPage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();

  const [periods, setPeriods] = useState<FamilyContextPeriodRecord[]>([]);
  const [members, setMembers] = useState<HouseholdMemberRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contextType, setContextType] =
    useState<FamilyContextType>("work_travel");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [affectedChildId, setAffectedChildId] = useState("");
  const [description, setDescription] = useState("");
  const [childcareMode, setChildcareMode] =
    useState<ChildcareMode>("home_with_me");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const reloadPeriods = useCallback(async (activeHouseholdId: string) => {
    const loaded = await loadActiveAndFuturePeriods(activeHouseholdId);
    setPeriods(loaded);
  }, []);

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        setLoading(true);
        setErrorMessage("");

        const activeHouseholdId = await getCurrentHouseholdId(user.id);
        setHouseholdId(activeHouseholdId);

        const [loadedMembers, loadedChildren] = await Promise.all([
          getHouseholdMembers(activeHouseholdId),
          getChildrenByHousehold(activeHouseholdId),
        ]);

        setMembers(loadedMembers);
        setChildren(loadedChildren);
        await reloadPeriods(activeHouseholdId);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger le contexte familial.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, reloadPeriods]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContextType("work_travel");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setSelectedUserId("");
    setAffectedChildId("");
    setDescription("");
    setChildcareMode("home_with_me");
  }

  function startEdit(period: FamilyContextPeriodRecord) {
    setEditingId(period.id);
    setTitle(period.title);
    setContextType(period.context_type);
    setStartDate(isoToDateInput(period.starts_at));
    setEndDate(isoToDateInput(period.ends_at));
    setStartTime(isoToTimeInput(period.starts_at));
    setEndTime(isoToTimeInput(period.ends_at));
    setSelectedUserId(period.user_id ?? "");
    setAffectedChildId(period.affected_member_id ?? "");
    setDescription(period.description ?? "");
    setChildcareMode(
      (period.impact?.childcareMode as ChildcareMode | undefined) ??
        "home_with_me",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !householdId) return;

    if (!startDate || !endDate) {
      setErrorMessage("Les dates de début et de fin sont obligatoires.");
      return;
    }

    const startsAt = combineDateTime(startDate, startTime, "start");
    const endsAt = combineDateTime(endDate, endTime, "end");

    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setErrorMessage("La date de fin doit être après le début.");
      return;
    }

    const resolvedTitle =
      title.trim() ||
      suggestTitle({
        contextType,
        userId: selectedUserId || null,
        members,
      });

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setSaving(true);

      const payload = {
        contextType,
        title: resolvedTitle,
        startsAt,
        endsAt,
        userId:
          contextType === "work_travel" ||
          contextType === "user_vacation" ||
          contextType === "exceptional_work_hours"
            ? selectedUserId || user.id
            : null,
        affectedMemberId: affectedChildId || null,
        description: description.trim() || null,
        impact:
          contextType === "children_vacation"
            ? { childcareMode }
            : undefined,
      };

      if (editingId) {
        await updateFamilyContextPeriod({
          periodId: editingId,
          period: payload,
        });
        setSuccessMessage("Période mise à jour.");
      } else {
        await createFamilyContextPeriod({
          userId: user.id,
          period: payload,
        });
        setSuccessMessage("Période enregistrée — le planning s’adaptera.");
      }

      await reloadPeriods(householdId);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la période.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(periodId: string) {
    if (!householdId) return;

    try {
      await cancelFamilyContextPeriod(periodId);
      await reloadPeriods(householdId);
      setSuccessMessage("Période annulée.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’annuler la période.",
      );
    }
  }

  async function handleDelete(periodId: string) {
    if (!householdId) return;

    try {
      await deleteFamilyContextPeriod(periodId);
      await reloadPeriods(householdId);
      setSuccessMessage("Période supprimée.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la période.",
      );
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>Chargement du contexte familial...</p>
      </main>
    );
  }

  return (
    <main className="planning-page">
      <section className="planning-container">
        <header className="planning-header">
          <p className="card-label">Contexte familial</p>
          <h1>Situations temporaires</h1>
          <p>
            Vacances, absences, parent seul… Le planning s’adapte à chaque
            période déclarée.
          </p>
        </header>

        {errorMessage && (
          <div className="message message-error">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="message message-success">{successMessage}</div>
        )}

        <section className="planning-section">
          <h2>Périodes actives et futures</h2>

          {periods.length === 0 ? (
            <EmptyState
              aura="empty"
              title="Aucune période déclarée"
              description="Ajoute une absence, des vacances ou une période de parent seul pour adapter le planning."
            />
          ) : (
            <div className="planning-list-cards">
              {periods.map((period) => (
                <article className="empty-card" key={period.id}>
                  <h3>{formatActiveContextBanner(period)}</h3>
                  <p>{formatPeriodRange(period)}</p>
                  <p>
                    <small>{getContextTypeLabel(period.context_type)}</small>
                  </p>
                  {period.context_type === "children_vacation" &&
                    period.impact?.childcareMode && (
                      <p>
                        <small>
                          Garde :{" "}
                          {getChildcareModeLabel(
                            period.impact.childcareMode as import("../types/childcare").ChildcareMode,
                          )}
                        </small>
                      </p>
                    )}
                  {period.description && <p>{period.description}</p>}

                  <div className="planning-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(period)}
                    >
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleCancel(period.id)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(period.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="auth-form routine-form">
          <h2>{editingId ? "Modifier la période" : "Ajouter une période"}</h2>

          <label>
            <span>Type</span>
            <select
              value={contextType}
              onChange={(event) =>
                setContextType(event.target.value as FamilyContextType)
              }
            >
              {FAMILY_CONTEXT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {contextType === "children_vacation" && (
            <ChildcareModeSelector
              value={childcareMode}
              onChange={setChildcareMode}
              idPrefix="family-context"
            />
          )}

          <label>
            <span>Titre (facultatif)</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex. William en déplacement du 18 au 24 juillet"
            />
          </label>

          <label>
            <span>Date de début</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Heure de début (facultatif)</span>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <label>
            <span>Date de fin</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Heure de fin (facultatif)</span>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>

          {(contextType === "work_travel" ||
            contextType === "user_vacation" ||
            contextType === "exceptional_work_hours") && (
            <label>
              <span>Adulte concerné</span>
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                <option value="">Moi</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.display_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(contextType === "child_sick" ||
            contextType === "child_absent" ||
            contextType === "children_vacation") && (
            <label>
              <span>Enfant concerné (facultatif)</span>
              <select
                value={affectedChildId}
                onChange={(event) => setAffectedChildId(event.target.value)}
              >
                <option value="">Tous les enfants</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span>Description (facultatif)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Ex. Déplacement professionnel à Paris"
            />
          </label>

          <Button type="submit" loading={saving} disabled={saving}>
            {editingId ? "Mettre à jour" : "Ajouter la période"}
          </Button>

          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Annuler l’édition
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => goToRoute(AppRoutes.CALENDAR)}
          >
            Calendrier
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

import { useCallback, useEffect, useMemo, useState } from "react";

import { PROFILE_SECTIONS, type ProfileSectionId } from "../config/profileSections";
import type { DiscoveryQuestion } from "../config/discoveryQuestions";
import { GoogleCalendarIntegrations } from "../components/profile/GoogleCalendarIntegrations";
import { EveningPlanningPreference } from "../components/profile/EveningPlanningPreference";
import { WorkScheduleSection } from "../components/profile/WorkScheduleSection";
import { SportSettingsSection } from "../components/profile/SportSettingsSection";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { getDiscoveryProgressSummary } from "../lib/navigation/progressChecks";
import {
  getFactDisplayValue,
  loadUserProfileFacts,
  saveIdentityProfile,
  saveProfileSectionFacts,
} from "../services/profileManagementService";
import type { ProfileFactRecord } from "../types";

function getFactValue(facts: ProfileFactRecord[], key: string): unknown {
  return facts.find((fact) => fact.fact_key === key)?.fact_value?.value;
}

function DiscoveryField({
  question,
  value,
  onChange,
}: {
  question: DiscoveryQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (question.type === "select" && question.options) {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choisir…</option>
        {question.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "multi-select" && question.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="profile-multi-select">
        {question.options.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...selected, option.value]);
                } else {
                  onChange(selected.filter((item) => item !== option.value));
                }
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : ""}
        placeholder={question.placeholder}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : "")
        }
      />
    );
  }

  if (question.type === "time") {
    return (
      <input
        type="time"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      placeholder={question.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

const PROFILE_CARD_META: Record<
  ProfileSectionId,
  { icon: string; cardClass: string }
> = {
  identity: { icon: "👤", cardClass: "profile-card-identity" },
  work: { icon: "💼", cardClass: "profile-card-work" },
  sleep: { icon: "🌙", cardClass: "profile-card-sleep" },
  studies: { icon: "📚", cardClass: "profile-card-studies" },
  sport: { icon: "🏃", cardClass: "profile-card-sport" },
  rest: { icon: "🛋️", cardClass: "profile-card-rest" },
  spirituality: { icon: "✨", cardClass: "profile-card-spirituality" },
  priorities: { icon: "🎯", cardClass: "profile-card-priorities" },
};

export function ProfilePage() {
  const { user } = useAuth();
  const [facts, setFacts] = useState<ProfileFactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});
  const [identityDraft, setIdentityDraft] = useState({
    partnerName: "",
    workStart: "",
    workEnd: "",
    wakeTime: "",
    bedTime: "",
    mainPriority: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const loaded = await loadUserProfileFacts(user.id);
      setFacts(loaded);

      const partner = loaded.find((fact) => fact.fact_key === "partner_name");
      const work = loaded.find((fact) => fact.fact_key === "work_schedule");
      const sleep = loaded.find((fact) => fact.fact_key === "sleep_schedule");
      const priority = loaded.find((fact) => fact.fact_key === "main_priority");

      setIdentityDraft({
        partnerName:
          typeof partner?.fact_value?.value === "string"
            ? partner.fact_value.value
            : "",
        workStart:
          typeof work?.fact_value?.start === "string" ? work.fact_value.start : "",
        workEnd: typeof work?.fact_value?.end === "string" ? work.fact_value.end : "",
        wakeTime:
          typeof sleep?.fact_value?.wake_time === "string"
            ? sleep.fact_value.wake_time
            : "",
        bedTime:
          typeof sleep?.fact_value?.bed_time === "string"
            ? sleep.fact_value.bed_time
            : "",
        mainPriority:
          typeof priority?.fact_value?.value === "string"
            ? priority.fact_value.value
            : "",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const email = user?.email ?? "—";
  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Utilisateur";

  const sections = useMemo(() => PROFILE_SECTIONS, []);

  const discoveryProgress = useMemo(
    () => getDiscoveryProgressSummary(facts),
    [facts],
  );

  async function handleSaveSection(sectionId: string) {
    if (!user) return;

    try {
      setSaving(true);
      setMessage("");

      if (sectionId === "identity") {
        await saveIdentityProfile({
          userId: user.id,
          ...identityDraft,
        });
      } else {
        const section = sections.find((item) => item.id === sectionId);
        if (!section) return;

        await saveProfileSectionFacts({
          userId: user.id,
          facts: section.questions.map((question) => ({
            key: question.key,
            value: { value: draftValues[question.key] ?? null },
          })),
        });
      }

      setMessage("Profil mis à jour.");
      setEditingSection(null);
      await reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer cette section.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="profile-page">
        <section className="profile-container">
          <div className="profile-hero">
            <div className="profile-hero-avatar" aria-hidden="true">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-hero-info">
              <p className="ds-label">Mon profil</p>
              <h2>Bonjour {firstName}</h2>
              <p>{email}</p>
              <div className="profile-progress-bar" role="progressbar" aria-valuenow={discoveryProgress.percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progression IA">
                <div
                  className="profile-progress-fill"
                  style={{ width: `${discoveryProgress.percentage}%` }}
                />
              </div>
              <p className="profile-hero-progress-label">
                Progression IA : <strong>{discoveryProgress.percentage} %</strong>
                {" · "}
                {discoveryProgress.answeredCount} réponses sur{" "}
                {discoveryProgress.applicableCount}
              </p>
            </div>
          </div>

          {message && <div className="message message-success">{message}</div>}

          {loading ? (
            <p>Chargement de ton profil…</p>
          ) : (
            <div className="profile-cards-grid">
              <article className={`profile-premium-card ${PROFILE_CARD_META.identity.cardClass}`}>
                <div className="profile-premium-card-header">
                  <div className="profile-premium-card-icon" aria-hidden="true">
                    {PROFILE_CARD_META.identity.icon}
                  </div>
                  <div>
                    <h3>Identité</h3>
                    <p>Informations personnelles de base</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingSection("identity");
                    }}
                  >
                    Modifier
                  </Button>
                </div>

                {editingSection === "identity" ? (
                  <div className="profile-edit-form">
                    <label>
                      Prénom du conjoint (facultatif)
                      <input
                        value={identityDraft.partnerName}
                        onChange={(event) =>
                          setIdentityDraft((current) => ({
                            ...current,
                            partnerName: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Début travail
                      <input
                        type="time"
                        value={identityDraft.workStart}
                        onChange={(event) =>
                          setIdentityDraft((current) => ({
                            ...current,
                            workStart: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Fin travail
                      <input
                        type="time"
                        value={identityDraft.workEnd}
                        onChange={(event) =>
                          setIdentityDraft((current) => ({
                            ...current,
                            workEnd: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Réveil
                      <input
                        type="time"
                        value={identityDraft.wakeTime}
                        onChange={(event) =>
                          setIdentityDraft((current) => ({
                            ...current,
                            wakeTime: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Coucher
                      <input
                        type="time"
                        value={identityDraft.bedTime}
                        onChange={(event) =>
                          setIdentityDraft((current) => ({
                            ...current,
                            bedTime: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Priorité principale
                      <input
                        value={identityDraft.mainPriority}
                        onChange={(event) =>
                          setIdentityDraft((current) => ({
                            ...current,
                            mainPriority: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="profile-edit-actions">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingSection(null)}
                      >
                        Annuler
                      </Button>
                      <Button
                        loading={saving}
                        onClick={() => void handleSaveSection("identity")}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="profile-summary-list">
                    <li>Conjoint : {getFactDisplayValue(facts, "partner_name")}</li>
                    <li>Travail : {getFactDisplayValue(facts, "work_schedule")}</li>
                    <li>Sommeil : {getFactDisplayValue(facts, "sleep_schedule")}</li>
                    <li>
                      Priorité : {getFactDisplayValue(facts, "main_priority")}
                    </li>
                  </ul>
                )}
              </article>

              {sections
                .filter((section) => section.id !== "identity")
                .map((section) => {
                  const meta = PROFILE_CARD_META[section.id];
                  return (
                  <article
                    className={`profile-premium-card ${meta.cardClass}`}
                    key={section.id}
                  >
                    <div className="profile-premium-card-header">
                      <div className="profile-premium-card-icon" aria-hidden="true">
                        {meta.icon}
                      </div>
                      <div>
                        <h3>{section.title}</h3>
                        <p>{section.description}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingSection(section.id);
                          setDraftValues(
                            Object.fromEntries(
                              section.questions.map((question) => [
                                question.key,
                                getFactValue(facts, question.key) ?? "",
                              ]),
                            ),
                          );
                        }}
                      >
                        Modifier
                      </Button>
                    </div>

                    {editingSection === section.id ? (
                      <div className="profile-edit-form">
                        {section.questions.map((question) => (
                          <label key={question.key}>
                            {question.title}
                            <DiscoveryField
                              question={question}
                              value={draftValues[question.key]}
                              onChange={(value) =>
                                setDraftValues((current) => ({
                                  ...current,
                                  [question.key]: value,
                                }))
                              }
                            />
                          </label>
                        ))}
                        <div className="profile-edit-actions">
                          <Button
                            variant="secondary"
                            onClick={() => setEditingSection(null)}
                          >
                            Annuler
                          </Button>
                          <Button
                            loading={saving}
                            onClick={() => void handleSaveSection(section.id)}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ul className="profile-summary-list">
                        {section.questions.map((question) => (
                          <li key={question.key}>
                            {question.title} :{" "}
                            {getFactDisplayValue(facts, question.key)}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.id === "work" && user && (
                      <WorkScheduleSection
                        userId={user.id}
                        facts={facts}
                        workStart={
                          typeof getFactValue(facts, "work_schedule") === "object" &&
                          getFactValue(facts, "work_schedule") !== null &&
                          typeof (getFactValue(facts, "work_schedule") as { start?: string })
                            .start === "string"
                            ? (getFactValue(facts, "work_schedule") as { start: string }).start
                            : identityDraft.workStart || "09:00"
                        }
                        workEnd={
                          typeof getFactValue(facts, "work_schedule") === "object" &&
                          getFactValue(facts, "work_schedule") !== null &&
                          typeof (getFactValue(facts, "work_schedule") as { end?: string })
                            .end === "string"
                            ? (getFactValue(facts, "work_schedule") as { end: string }).end
                            : identityDraft.workEnd || "17:00"
                        }
                        commuteMinutes={
                          typeof getFactValue(facts, "commute_duration") === "number"
                            ? (getFactValue(facts, "commute_duration") as number)
                            : undefined
                        }
                      />
                    )}

                    {section.id === "sport" && user && (
                      <SportSettingsSection userId={user.id} />
                    )}

                    {section.id === "rest" && user && (
                      <EveningPlanningPreference userId={user.id} />
                    )}
                  </article>
                  );
                })}
            </div>
          )}

          {user && <GoogleCalendarIntegrations userId={user.id} />}
        </section>
    </main>
  );
}

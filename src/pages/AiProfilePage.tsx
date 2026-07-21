import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import type { HumanModel, InterpretedField } from "../ai/humanModelFoundation";
import { HumanModelFieldCard } from "../components/humanModel/HumanModelFieldCard";
import { HumanModelWhyModal } from "../components/humanModel/HumanModelWhyModal";
import { Button } from "../components/ui/Button";
import { isHumanModelEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { useHumanModel } from "../hooks/useHumanModel";
import { AppRoutes } from "../lib/navigation/routes";

type FieldKey =
  | "currentState"
  | "energy"
  | "mentalLoad"
  | "motivation"
  | "availability"
  | "focus"
  | "sleep"
  | "stress"
  | "familyPressure"
  | "dominantGoal"
  | "dominantConcern";

const FIELD_LABELS: Record<FieldKey, string> = {
  currentState: "Mon état actuel",
  energy: "Mon énergie",
  mentalLoad: "Ma charge mentale",
  motivation: "Ma motivation",
  availability: "Ma disponibilité",
  focus: "Ma concentration",
  sleep: "Mon sommeil",
  stress: "Mon stress",
  familyPressure: "Pression familiale",
  dominantGoal: "Objectif dominant",
  dominantConcern: "Préoccupation dominante",
};

function getField(model: HumanModel, key: FieldKey): InterpretedField<unknown> {
  return model[key] as InterpretedField<unknown>;
}

export function AiProfilePage() {
  useAppPageTitle("Mon Profil IA");

  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Utilisateur";

  const { enabled, humanModel, loading, error, refresh } = useHumanModel(
    user?.id,
    firstName,
  );

  const [whyField, setWhyField] = useState<FieldKey | null>(null);

  const cards = useMemo(
    () =>
      humanModel
        ? (Object.keys(FIELD_LABELS) as FieldKey[]).map((key) => ({
            key,
            title: FIELD_LABELS[key],
            field: getField(humanModel, key),
          }))
        : [],
    [humanModel],
  );

  if (!isHumanModelEnabled()) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  if (!enabled || !user) {
    return (
      <main className="dashboard-page ai-profile-page">
        <section className="dashboard-container">
          <p>Connecte-toi pour consulter ton profil IA.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page ai-profile-page">
      <section className="dashboard-container ai-profile-layout">
        <header className="ai-profile-header">
          <div>
            <p className="ds-label">Organisation</p>
            <h1 data-testid="ai-profile-page-title">Mon Profil IA</h1>
            <p className="ai-profile-subtitle">
              Ce que l&apos;IA comprend de ton état — avec explications et
              niveau de confiance.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
            Actualiser
          </Button>
        </header>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {loading && !humanModel && <p>Chargement du modèle utilisateur…</p>}

        {humanModel && (
          <>
            <section className="ai-profile-summary">
              <p>
                Confiance globale :{" "}
                <strong>{Math.round(humanModel.confidence * 100)} %</strong>
              </p>
              <p className="ai-profile-updated">
                Dernière mise à jour :{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(humanModel.lastUpdated))}
              </p>
            </section>

            <section className="ai-profile-grid" data-testid="ai-profile-grid">
              {cards.map(({ key, title, field }) => (
                <HumanModelFieldCard
                  key={key}
                  title={title}
                  field={field}
                  testId={`ai-profile-field-${key}`}
                  onWhy={() => setWhyField(key)}
                />
              ))}
            </section>

            <section className="ai-profile-missing">
              <h2>Ce qui manque à l&apos;IA</h2>
              {humanModel.missingData.length === 0 ? (
                <p>Aucune lacune majeure identifiée pour l&apos;instant.</p>
              ) : (
                <ul>
                  {humanModel.missingData.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {whyField && humanModel && (
          <HumanModelWhyModal
            title={FIELD_LABELS[whyField]}
            field={getField(humanModel, whyField)}
            open={Boolean(whyField)}
            onClose={() => setWhyField(null)}
          />
        )}
      </section>
    </main>
  );
}

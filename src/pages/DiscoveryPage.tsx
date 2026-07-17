import { useCallback, useEffect, useState } from "react";

import { Button } from "../components/ui/Button";
import {
  discoveryQuestions,
  type DiscoveryQuestion,
} from "../config/discoveryQuestions";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import {
  buildFactsValueMap,
  filterAvailableQuestions,
} from "../lib/discovery/questionFilters";
import { useUserProgress } from "../hooks/useUserProgress";
import {
  getCurrentHouseholdId,
  getProfileFacts,
  saveProfileFact,
} from "../services/profileFactsService";
import {
  getDiscoveryProgressSummary,
  isDiscoveryComplete,
} from "../lib/navigation/progressChecks";

const QUESTIONS_PER_SESSION = 5;

export function DiscoveryPage() {
  const { user } = useAuth();
  const { completeDiscoveryAndContinue } = useAppNavigation();
  const { refreshProgress } = useUserProgress();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<
    DiscoveryQuestion[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [textValue, setTextValue] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [discoverySummary, setDiscoverySummary] = useState(
    getDiscoveryProgressSummary([]),
  );

  const currentQuestion = sessionQuestions[currentIndex];

  const loadSessionQuestions = useCallback(async () => {
    if (!user) return;

    const [loadedHouseholdId, loadedFacts] = await Promise.all([
      getCurrentHouseholdId(user.id),
      getProfileFacts(user.id),
    ]);

    setHouseholdId(loadedHouseholdId);
    setDiscoverySummary(getDiscoveryProgressSummary(loadedFacts));

    const loadedFactsMap = buildFactsValueMap(loadedFacts);
    const availableQuestions = filterAvailableQuestions(
      discoveryQuestions,
      loadedFactsMap,
    );

    setSessionQuestions(availableQuestions.slice(0, QUESTIONS_PER_SESSION));
    setCurrentIndex(0);
    setTextValue("");
    setSelectedValues([]);
  }, [user]);

  useEffect(() => {
    async function loadDiscovery() {
      if (!user) return;

      try {
        setLoading(true);
        await loadSessionQuestions();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les questions.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDiscovery();
  }, [user, loadSessionQuestions]);

  function resetAnswer() {
    setTextValue("");
    setSelectedValues([]);
  }

  function toggleSelectedValue(value: string) {
    setSelectedValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleValidate() {
    if (!user || !householdId || !currentQuestion) return;

    let answer: string | number | string[];

    if (currentQuestion.type === "multi-select") {
      if (selectedValues.length === 0) {
        setErrorMessage("Choisis au moins une réponse.");
        return;
      }

      answer = selectedValues;
    } else if (currentQuestion.type === "number") {
      if (!textValue) {
        setErrorMessage("Indique une valeur.");
        return;
      }

      answer = Number(textValue);

      if (!Number.isFinite(answer) || answer <= 0) {
        setErrorMessage("Indique une valeur valide.");
        return;
      }
    } else {
      if (!textValue.trim()) {
        setErrorMessage("Indique une réponse.");
        return;
      }

      answer = textValue.trim();
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await saveProfileFact({
        householdId,
        userId: user.id,
        factKey: currentQuestion.key,
        value: answer,
      });

      if (currentIndex + 1 >= sessionQuestions.length) {
        await refreshProgress();
        const facts = await getProfileFacts(user.id);

        if (isDiscoveryComplete(facts)) {
          await completeDiscoveryAndContinue();
        } else {
          await loadSessionQuestions();
        }

        return;
      }

      setCurrentIndex((current) => current + 1);
      resetAnswer();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la réponse.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>Préparation de tes questions...</p>
      </main>
    );
  }

  if (sessionQuestions.length === 0) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="brand-name">Équilibre IA</p>

          <h1>Je te connais déjà mieux</h1>

          <p className="auth-intro">
            Toutes les questions disponibles ont déjà reçu une réponse.
            Progression : {discoverySummary.percentage} % (
            {discoverySummary.answeredCount} / {discoverySummary.applicableCount}
            ).
          </p>

          <Button
            type="button"
            onClick={() => void completeDiscoveryAndContinue()}
          >
            Revenir à l’accueil
          </Button>
        </section>
      </main>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const progress =
    ((currentIndex + 1) / sessionQuestions.length) * 100;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="brand-name">Découverte quotidienne</p>

        <p className="auth-intro">
          Progression globale : {discoverySummary.percentage} % —{" "}
          {discoverySummary.answeredCount} / {discoverySummary.applicableCount}{" "}
          questions applicables.
        </p>

        <div className="discovery-progress">
          <div
            className="discovery-progress-value"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="question-counter">
          Question {currentIndex + 1} sur {sessionQuestions.length}
        </p>

        <h1>{currentQuestion.title}</h1>

        {currentQuestion.description && (
          <p className="auth-intro">{currentQuestion.description}</p>
        )}

        <div className="discovery-answer">
          {(currentQuestion.type === "text" ||
            currentQuestion.type === "number" ||
            currentQuestion.type === "time") && (
            <input
              type={currentQuestion.type}
              value={textValue}
              placeholder={currentQuestion.placeholder}
              onChange={(event) => setTextValue(event.target.value)}
            />
          )}

          {currentQuestion.type === "select" && (
            <div className="choice-list">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    textValue === option.value
                      ? "choice-button selected"
                      : "choice-button"
                  }
                  onClick={() => setTextValue(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multi-select" && (
            <div className="choice-list">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    selectedValues.includes(option.value)
                      ? "choice-button selected"
                      : "choice-button"
                  }
                  onClick={() => toggleSelectedValue(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="message message-error">{errorMessage}</div>
        )}

        <Button
          type="button"
          loading={saving}
          disabled={saving}
          onClick={handleValidate}
        >
          Continuer
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void completeDiscoveryAndContinue()}
        >
          Continuer un autre jour
        </Button>
      </section>
    </main>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  generateSpiritualSuggestions,
  buildSpiritualInputFromLifeContext,
} from "../ai/spiritualSuggestionEngine";
import { buildMemoryProfile } from "../ai/memoryEngine";
import { BIBLE_VERSION, getContentById } from "../content/spiritualContent";
import { AddToDayModal } from "../components/spiritual/AddToDayModal";
import { RelaxationPlayerModal } from "../components/spiritual/RelaxationPlayerModal";
import { Button } from "../components/ui/Button";
import { discoveryQuestions } from "../config/discoveryQuestions";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { appendSpiritualHistory, loadSpiritualHistory } from "../lib/spiritual/history";
import { buildSpiritualPreferences } from "../lib/spiritual/preferences";
import {
  buildRelaxationSuggestion,
  findSuggestionForTakeTimeOption,
  logSpiritualAction,
  openSpiritualSpotify,
  pickAnotherPrayerItem,
  pickAnotherRelaxationGuide,
  pickAnotherTodayWord,
  resolveSpiritualSpotifyUrl,
} from "../lib/spiritual/spiritualSpaceActions";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import {
  loadUserProfileFacts,
  saveProfileSectionFacts,
} from "../services/profileManagementService";
import { addSpiritualActivityToPlanning } from "../services/spiritualPlanningService";
import { loadPlanningContextWithLife } from "../services/memoryContextService";
import {
  addSpiritualFavorite,
  isSpiritualFavorite,
  loadSpiritualFavorites,
  removeSpiritualFavorite,
} from "../services/spiritualService";
import type { PrayerCategory, SpiritualSuggestion } from "../types/spiritual";
import type { LifeContext } from "../types/lifeContext";
import type { ProfileFactRecord } from "../types";
import type { RelaxationGuide } from "../types/spiritual";

const PRAYER_CATEGORIES: { id: PrayerCategory; label: string }[] = [
  { id: "morning", label: "Matin" },
  { id: "evening", label: "Soir" },
  { id: "gratitude", label: "Gratitude" },
  { id: "courage", label: "Courage" },
  { id: "fatigue", label: "Fatigue" },
  { id: "family", label: "Famille" },
  { id: "children", label: "Enfants" },
  { id: "work", label: "Travail" },
  { id: "studies", label: "Études" },
  { id: "peace", label: "Paix" },
  { id: "difficulty", label: "Difficulté" },
];

const TAKE_TIME_OPTIONS = [
  { id: "relaxation", label: "Relaxation" },
  { id: "breathing", label: "Respiration" },
  { id: "silence", label: "Silence" },
  { id: "prayer", label: "Prière" },
  { id: "gratitude", label: "Gratitude" },
  { id: "reading", label: "Lecture spirituelle" },
  { id: "walk", label: "Marche calme" },
  { id: "music", label: "Musique douce" },
  { id: "screen_free", label: "Temps sans écran" },
] as const;

function getQuestionOptions(key: string) {
  return discoveryQuestions.find((question) => question.key === key)?.options ?? [];
}

export function SpiritualSpacePage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();
  const preferencesRef = useRef<HTMLDivElement | null>(null);

  const [facts, setFacts] = useState<ProfileFactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<
    Awaited<ReturnType<typeof loadSpiritualFavorites>>
  >([]);
  const [prayerCategory, setPrayerCategory] = useState<PrayerCategory>("evening");
  const [addModal, setAddModal] = useState<{
    title: string;
    duration: number;
    suggestion: SpiritualSuggestion;
  } | null>(null);
  const [relaxationPlayer, setRelaxationPlayer] = useState<RelaxationGuide | null>(
    null,
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [lifeContext, setLifeContext] = useState<LifeContext | null>(null);
  const [contentReady, setContentReady] = useState(false);

  const profile = useMemo(() => buildMemoryProfile(facts), [facts]);
  const preferences = useMemo(
    () => buildSpiritualPreferences(profile),
    [profile],
  );

  const engineInput = useMemo(() => {
    if (lifeContext) {
      return buildSpiritualInputFromLifeContext(lifeContext, preferences);
    }

    return {
      hour: new Date().getHours(),
      availableMinutes: preferences.preferredDuration ?? 15,
      fatigueLevel:
        profile.afterWorkEnergy === "low"
          ? ("high" as const)
          : profile.afterWorkEnergy === "high"
            ? ("low" as const)
            : ("medium" as const),
      preferences,
      recentContentIds: historyIds,
    };
  }, [lifeContext, preferences, profile.afterWorkEnergy, historyIds]);

  const [todayWord, setTodayWord] = useState(() =>
    pickAnotherTodayWord(engineInput, "").next,
  );
  const [prayer, setPrayer] = useState(() =>
    pickAnotherPrayerItem({ ...engineInput, category: "evening" }, "").next,
  );
  const [relaxation, setRelaxation] = useState(() =>
    pickAnotherRelaxationGuide(
      {
        recentIds: historyIds,
        faithImportance: preferences.faithImportance,
      },
      "",
    ).next,
  );

  const suggestions = useMemo(
    () => generateSpiritualSuggestions(engineInput),
    [engineInput],
  );

  const spotifyUrl = useMemo(
    () => resolveSpiritualSpotifyUrl(profile.sportMusic),
    [profile.sportMusic],
  );

  const refreshContentFromEngine = useCallback(() => {
    setTodayWord(pickAnotherTodayWord(engineInput, "").next);
    setPrayer(
      pickAnotherPrayerItem({ ...engineInput, category: prayerCategory }, "")
        .next,
    );
    setRelaxation(
      pickAnotherRelaxationGuide(
        {
          recentIds: historyIds,
          faithImportance: preferences.faithImportance,
        },
        "",
      ).next,
    );
  }, [
    engineInput,
    historyIds,
    preferences.faithImportance,
    prayerCategory,
  ]);

  const reload = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      const [loadedFacts, loadedFavorites, planningContext] = await Promise.all([
        loadUserProfileFacts(user.id),
        loadSpiritualFavorites(user.id),
        loadPlanningContextWithLife({
          userId: user.id,
          date: getCurrentDeviceDate(),
        }),
      ]);
      setFacts(loadedFacts);
      setFavorites(loadedFavorites);
      setLifeContext(planningContext?.lifeContext ?? null);
      setHistoryIds(loadSpiritualHistory(user.id));
      setContentReady(false);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger l'espace spirituel.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (loading || contentReady) return;
    refreshContentFromEngine();
    setContentReady(true);
  }, [loading, contentReady, refreshContentFromEngine]);

  useEffect(() => {
    if (!contentReady) return;
    setPrayer(
      pickAnotherPrayerItem({ ...engineInput, category: prayerCategory }, "")
        .next,
    );
  }, [prayerCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function trackContent(id: string) {
    if (!user) return;
    setHistoryIds(appendSpiritualHistory(user.id, id));
  }

  function openAddToDayModal(payload: {
    title: string;
    duration: number;
    suggestion: SpiritualSuggestion;
  }) {
    clearFeedback();
    logSpiritualAction({
      action: "addSuggestionToDay",
      suggestionId: payload.suggestion.id,
      contentId: payload.suggestion.content?.id ?? payload.suggestion.guide?.id,
    });
    setAddModal(payload);
  }

  function handleRefreshSuggestion() {
    clearFeedback();
    logSpiritualAction({
      action: "refreshSuggestion",
      contentId: todayWord.id,
    });

    const { next, isDifferent } = pickAnotherTodayWord(engineInput, todayWord.id);
    if (!isDifferent) {
      setError("Aucune autre proposition disponible pour l'instant.");
      return;
    }

    setTodayWord(next);
    trackContent(next.id);
    setSuccess("Nouvelle proposition affichée.");
  }

  function handleShowAnotherPrayer() {
    clearFeedback();
    logSpiritualAction({
      action: "showAnotherPrayer",
      contentId: prayer.id,
    });

    const { next, isDifferent } = pickAnotherPrayerItem(
      { ...engineInput, category: prayerCategory },
      prayer.id,
    );

    if (!isDifferent) {
      setError("Aucune autre prière disponible dans cette catégorie.");
      return;
    }

    setPrayer(next);
    trackContent(next.id);
    setSuccess("Nouvelle prière affichée.");
  }

  function handleShowAnotherRelaxation() {
    clearFeedback();
    logSpiritualAction({
      action: "showAnotherRelaxation",
      contentId: relaxation.id,
    });

    const { next, isDifferent } = pickAnotherRelaxationGuide(
      {
        recentIds: historyIds,
        faithImportance: preferences.faithImportance,
      },
      relaxation.id,
    );

    if (!isDifferent) {
      setError("Aucun autre exercice disponible pour l'instant.");
      return;
    }

    setRelaxation(next);
    trackContent(next.id);
    setSuccess("Nouvel exercice affiché.");
  }

  function handleStartRelaxation() {
    clearFeedback();
    logSpiritualAction({
      action: "startRelaxation",
      contentId: relaxation.id,
    });
    setRelaxationPlayer(relaxation);
  }

  function handleTakeTimeOption(optionId: string) {
    clearFeedback();
    logSpiritualAction({ action: "addCalmTime", suggestionId: optionId });

    if (optionId === "music") {
      handleOpenSpotify();
      return;
    }

    const match = findSuggestionForTakeTimeOption(optionId, suggestions);
    if (!match) {
      setError(
        `Aucune suggestion « ${optionId} » disponible pour le moment — essaie « Ajouter à ma journée » sur une carte.`,
      );
      return;
    }

    openAddToDayModal({
      title: match.title,
      duration: match.durationMinutes || preferences.preferredDuration || 10,
      suggestion: match,
    });
  }

  function handleOpenSpotify() {
    clearFeedback();
    logSpiritualAction({ action: "openSpotify", disabled: !spotifyUrl });
    const result = openSpiritualSpotify(spotifyUrl);
    if (!result.ok) {
      setError(result.message ?? "Spotify n'est pas encore configuré.");
      return;
    }
    setSuccess("Spotify ouvert dans un nouvel onglet.");
  }

  function handleFocusPreferences() {
    clearFeedback();
    logSpiritualAction({ action: "focusPreferences" });
    preferencesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSuccess("Tu peux modifier tes préférences ci-dessous.");
  }

  async function handleAddFavorite(contentId: string, contentType: string, text: string) {
    if (!user) return;

    clearFeedback();
    logSpiritualAction({ action: "addFavorite", contentId });

    try {
      const alreadyFavorite = await isSpiritualFavorite({ userId: user.id, contentId });
      if (alreadyFavorite) {
        setSuccess("Déjà dans tes favoris.");
        return;
      }

      await addSpiritualFavorite({
        userId: user.id,
        contentId,
        contentType,
        customText: text,
      });
      setFavorites(await loadSpiritualFavorites(user.id));
      setSuccess("Ajouté à tes favoris.");
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "Impossible d'ajouter aux favoris.",
      );
    }
  }

  async function handleRemoveFavorite(favoriteId: string) {
    if (!user) return;

    clearFeedback();
    logSpiritualAction({ action: "removeFavorite", contentId: favoriteId });

    try {
      await removeSpiritualFavorite({ userId: user.id, favoriteId });
      setFavorites(await loadSpiritualFavorites(user.id));
      setSuccess("Favori retiré.");
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Impossible de retirer le favori.",
      );
    }
  }

  async function handleSavePreference(key: string, value: string | string[]) {
    if (!user) return;

    clearFeedback();
    logSpiritualAction({ action: "savePreferences", suggestionId: key });

    try {
      setSavingPrefs(true);
      await saveProfileSectionFacts({
        userId: user.id,
        facts: [{ key, value: { value } }],
      });
      setFacts(await loadUserProfileFacts(user.id));
      setSuccess("Préférences enregistrées.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer les préférences.",
      );
    } finally {
      setSavingPrefs(false);
    }
  }

  async function confirmAddToDay(options: {
    schedule: "now" | "next_free" | "custom";
    durationMinutes: number;
    customStartTime?: string;
  }) {
    if (!user || !addModal) return;

    await addSpiritualActivityToPlanning({
      userId: user.id,
      date: getCurrentDeviceDate(),
      title: addModal.title,
      durationMinutes: options.durationMinutes,
      schedule: options.schedule,
      customStartTime: options.customStartTime,
      preferredMoment: preferences.preferredMoment,
      spiritualActivityType: addModal.suggestion.activityType,
      contentId: addModal.suggestion.content?.id ?? addModal.suggestion.guide?.id,
      generatedContent: (addModal.suggestion.content ??
        addModal.suggestion.guide) as unknown as Record<string, unknown>,
      sourceReason: addModal.suggestion.reason,
    });

    if (addModal.suggestion.content?.id) {
      trackContent(addModal.suggestion.content.id);
    }

    setSuccess("Moment ajouté à ta journée.");
    setAddModal(null);
  }

  const isDisabled = preferences.faithImportance === "disabled";
  const todayIsFavorite = favorites.some(
    (favorite) => favorite.content_id === todayWord.id,
  );
  const prayerIsFavorite = favorites.some(
    (favorite) => favorite.content_id === prayer.id,
  );

  return (
    <main className="planning-page spiritual-space-page">
      <section className="planning-container">
        <div className="spiritual-space-illustration" aria-hidden="true">
          ✦
        </div>
        <header className="planning-header">
          <p className="card-label">✦ Spiritualité</p>
          <h1>Mon espace spirituel</h1>
          <p>
            Un lieu calme pour toi — propositions facultatives, jamais imposées.
          </p>
          {isDisabled && (
            <p className="planning-hint">
              Spiritualité désactivée dans tes préférences. Tu peux l'activer
              ci-dessous ou depuis ton profil.
            </p>
          )}
        </header>

        {loading && <p>Chargement...</p>}
        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-success">{success}</div>}

        {!loading && (
          <>
            <section className="planning-section spiritual-section">
              <h2>Aujourd'hui</h2>

              <article className="spiritual-card">
                <p className="card-label">
                  {todayWord.title ?? "Une parole pour aujourd'hui"}
                </p>
                {todayWord.reference && (
                  <p className="spiritual-reference">{todayWord.reference}</p>
                )}
                <p>{todayWord.text}</p>
                {todayWord.source && (
                  <p className="planning-hint">Version : {todayWord.source}</p>
                )}

                <div className="spiritual-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRefreshSuggestion}
                  >
                    Afficher une autre proposition
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      openAddToDayModal({
                        title: todayWord.title ?? "Moment spirituel",
                        duration: todayWord.durationMinutes,
                        suggestion: {
                          id: `today-${todayWord.id}`,
                          activityType: "reflection",
                          title: todayWord.title ?? "Moment spirituel",
                          description: todayWord.text,
                          durationMinutes: todayWord.durationMinutes,
                          reason: "Proposition du jour",
                          optional: true,
                          content: todayWord,
                        },
                      })
                    }
                  >
                    Ajouter à ma journée
                  </Button>
                  {!todayIsFavorite ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        void handleAddFavorite(
                          todayWord.id,
                          todayWord.type,
                          todayWord.text,
                        )
                      }
                    >
                      Ajouter aux favoris
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" disabled>
                      Déjà en favori
                    </Button>
                  )}
                </div>
              </article>
            </section>

            <section className="planning-section spiritual-section">
              <h2>Prendre un temps pour moi</h2>
              <div className="spiritual-chip-grid">
                {TAKE_TIME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="spiritual-chip"
                    onClick={() => handleTakeTimeOption(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="spiritual-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    openAddToDayModal({
                      title: "Temps calme",
                      duration: preferences.preferredDuration ?? 10,
                      suggestion: {
                        id: "calm-moment",
                        activityType: "silence",
                        title: "Temps calme",
                        description: "Quelques minutes sans écran ni pression.",
                        durationMinutes: preferences.preferredDuration ?? 10,
                        reason: "Moment calme facultatif",
                        optional: true,
                      },
                    })
                  }
                >
                  Ajouter un temps calme
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenSpotify}
                >
                  Ouvrir Spotify
                </Button>
              </div>

              <ul className="spiritual-suggestion-list">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <article className="spiritual-card">
                      <h3>{suggestion.title}</h3>
                      <p>{suggestion.description}</p>
                      <p className="planning-hint">{suggestion.reason}</p>
                      {suggestion.id !== "keep-free" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            openAddToDayModal({
                              title: suggestion.title,
                              duration: suggestion.durationMinutes || 5,
                              suggestion,
                            })
                          }
                        >
                          Ajouter à ma journée
                        </Button>
                      ) : (
                        <p className="spiritual-hint">{suggestion.description}</p>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <section className="planning-section spiritual-section">
              <h2>Me recentrer</h2>
              <article className="spiritual-card">
                <h3>{relaxation.title}</h3>
                <ol className="spiritual-steps">
                  {relaxation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <div className="spiritual-actions">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStartRelaxation}
                  >
                    Lancer une relaxation
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleShowAnotherRelaxation}
                  >
                    Autre exercice
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      openAddToDayModal({
                        title: relaxation.title,
                        duration: relaxation.durationMinutes,
                        suggestion: buildRelaxationSuggestion(relaxation),
                      })
                    }
                  >
                    Ajouter à ma journée
                  </Button>
                </div>
              </article>
            </section>

            {!isDisabled && (
              <section className="planning-section spiritual-section">
                <h2>Prier</h2>
                <div className="spiritual-chip-grid">
                  {PRAYER_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`spiritual-chip${prayerCategory === category.id ? " spiritual-chip-active" : ""}`}
                      onClick={() => setPrayerCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <article className="spiritual-card">
                  <p className="spiritual-reference">
                    {prayer.reference ?? prayer.title}
                  </p>
                  <p>{prayer.text}</p>
                  <div className="spiritual-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleShowAnotherPrayer}
                    >
                      Afficher une autre prière
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        openAddToDayModal({
                          title: prayer.title ?? "Prière",
                          duration: prayer.durationMinutes,
                          suggestion: {
                            id: `prayer-${prayer.id}`,
                            activityType: "prayer",
                            title: prayer.title ?? "Prière",
                            description: prayer.text,
                            durationMinutes: prayer.durationMinutes,
                            reason: "Prière facultative",
                            optional: true,
                            content: prayer,
                          },
                        })
                      }
                    >
                      Ajouter à ma journée
                    </Button>
                    {!prayerIsFavorite ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          void handleAddFavorite(prayer.id, "prayer", prayer.text)
                        }
                      >
                        Ajouter aux favoris
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" disabled>
                        Déjà en favori
                      </Button>
                    )}
                  </div>
                </article>
              </section>
            )}

            <section
              ref={preferencesRef}
              className="planning-section spiritual-section"
            >
              <h2>Mes préférences</h2>
              <div className="spiritual-prefs-grid">
                <label>
                  <span>Place de la spiritualité</span>
                  <select
                    value={profile.faithImportance ?? "disabled"}
                    onChange={(event) =>
                      void handleSavePreference(
                        "faith_importance",
                        event.target.value,
                      )
                    }
                    disabled={savingPrefs}
                  >
                    {getQuestionOptions("faith_importance").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Durée favorite</span>
                  <select
                    value={String(preferences.preferredDuration ?? 10)}
                    onChange={(event) =>
                      void handleSavePreference(
                        "spiritual_preferred_duration",
                        event.target.value,
                      )
                    }
                    disabled={savingPrefs}
                  >
                    {getQuestionOptions("spiritual_preferred_duration").map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>Moment préféré</span>
                  <select
                    value={preferences.preferredMoment ?? "evening"}
                    onChange={(event) =>
                      void handleSavePreference(
                        "spiritual_preferred_moment",
                        event.target.value,
                      )
                    }
                    disabled={savingPrefs}
                  >
                    {getQuestionOptions("spiritual_preferred_moment").map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>Carte sur l'accueil</span>
                  <select
                    value={preferences.showOnHome === false ? "no" : "yes"}
                    onChange={(event) =>
                      void handleSavePreference(
                        "spiritual_show_on_home",
                        event.target.value,
                      )
                    }
                    disabled={savingPrefs}
                  >
                    {getQuestionOptions("spiritual_show_on_home").map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <div className="spiritual-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleFocusPreferences}
                >
                  Modifier les préférences
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => goToRoute(AppRoutes.USER_PROFILE)}
                >
                  Toutes les préférences dans Mon profil
                </Button>
              </div>
            </section>

            <section className="planning-section spiritual-section">
              <h2>Mes favoris</h2>
              {favorites.length === 0 ? (
                <p className="planning-hint">
                  Aucun favori pour l'instant — enregistre une phrase ou une
                  prière qui te parle.
                </p>
              ) : (
                <ul className="spiritual-suggestion-list">
                  {favorites.map((favorite) => {
                    const content = getContentById(favorite.content_id);
                    return (
                      <li key={favorite.id}>
                        <article className="spiritual-card">
                          <p>
                            {favorite.custom_text ??
                              content?.text ??
                              favorite.content_id}
                          </p>
                          <div className="spiritual-actions">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                void handleRemoveFavorite(favorite.id)
                              }
                            >
                              Retirer des favoris
                            </Button>
                            {content && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  openAddToDayModal({
                                    title: content.title ?? "Favori",
                                    duration: content.durationMinutes,
                                    suggestion: {
                                      id: favorite.id,
                                      activityType: "reflection",
                                      title: content.title ?? "Favori",
                                      description: content.text,
                                      durationMinutes: content.durationMinutes,
                                      reason: "Depuis tes favoris",
                                      optional: true,
                                      content,
                                    },
                                  })
                                }
                              >
                                Ajouter à ma journée
                              </Button>
                            )}
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="planning-section spiritual-section">
              <h2>Historique récent</h2>
              {historyIds.length === 0 ? (
                <p className="planning-hint">
                  Les contenus proposés apparaîtront ici pour éviter les
                  répétitions.
                </p>
              ) : (
                <ul className="spiritual-history-list">
                  {historyIds.slice(0, 8).map((id) => {
                    const content = getContentById(id);
                    return (
                      <li key={id}>
                        {content?.reference ?? content?.title ?? id} —{" "}
                        {content?.text.slice(0, 60) ?? "Contenu local"}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <p className="spiritual-hint">
              Versets bibliques : {BIBLE_VERSION}. Propositions toujours
              facultatives.
            </p>
          </>
        )}
      </section>

      {addModal && (
        <AddToDayModal
          open
          title={addModal.title}
          defaultDuration={addModal.duration}
          onClose={() => setAddModal(null)}
          onConfirm={confirmAddToDay}
        />
      )}

      {relaxationPlayer && (
        <RelaxationPlayerModal
          guide={relaxationPlayer}
          onClose={() => setRelaxationPlayer(null)}
          onFinish={() => setSuccess("Relaxation terminée — bien joué.")}
        />
      )}
    </main>
  );
}

import { useCallback, useEffect, useState } from "react";

import {
  LEISURE_ACTIVITIES,
  MUSIC_PLAYLISTS,
  getLeisureActivitiesByCategory,
} from "../data/leisureContentLibrary";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useUrlDate } from "../hooks/useUrlDate";
import { getCurrentHouseholdId } from "../services/householdService";
import {
  addLeisureFavorite,
  loadLeisureFavorites,
  removeLeisureFavorite,
} from "../services/leisureFavoriteService";
import { addLeisureActivityToPlanning } from "../services/leisurePlanningService";
import type { LeisureFavoriteRecord } from "../types/leisure";

function openSpotify(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function LeisureSpacePage() {
  const { user } = useAuth();
  const { goToRoute, AppRoutes } = useAppNavigation();
  const { selectedDate } = useUrlDate();

  const [favorites, setFavorites] = useState<LeisureFavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reloadFavorites = useCallback(async () => {
    if (!user) return;
    const loaded = await loadLeisureFavorites(user.id);
    setFavorites(loaded);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void reloadFavorites()
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [user, reloadFavorites]);

  async function handleAddToPlanning(activityId: string) {
    if (!user) return;

    try {
      setSavingId(activityId);
      setError("");
      const result = await addLeisureActivityToPlanning({
        userId: user.id,
        date: selectedDate,
        activityId,
      });
      setMessage(result.explanation);
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : "Impossible d'ajouter cette activité.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleFavorite(activityId: string, category: "sport" | "leisure") {
    if (!user) return;

    const existing = favorites.find((item) => item.activity_id === activityId);

    try {
      if (existing) {
        await removeLeisureFavorite(existing.id);
      } else {
        const householdId = await getCurrentHouseholdId(user.id);
        await addLeisureFavorite({
          userId: user.id,
          householdId,
          activityId,
          category,
        });
      }
      await reloadFavorites();
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "Impossible de mettre à jour le favori.",
      );
    }
  }

  const sportActivities = getLeisureActivitiesByCategory("sport");
  const leisureActivities = getLeisureActivitiesByCategory("leisure");
  const favoriteIds = new Set(favorites.map((item) => item.activity_id));

  return (
    <main className="dashboard-page leisure-space-page">
      <section className="dashboard-container">
        <header className="leisure-space-header">
          <div>
            <p className="ds-label">Loisirs</p>
            <h1>Ton espace détente</h1>
            <p className="leisure-space-subtitle">
              Sport, musique et activités — toujours à ton rythme, jamais imposé.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => goToRoute(AppRoutes.PLANNING)}>
            Voir le planning
          </Button>
        </header>

        {message && <div className="message message-success">{message}</div>}
        {error && <div className="message message-error">{error}</div>}
        {loading && <p className="leisure-space-loading">Chargement…</p>}

        <section className="leisure-space-section">
          <h2>Sport</h2>
          <p className="leisure-section-intro">
            Petites séances adaptées — ajoute-les au planning quand tu veux.
          </p>
          <div className="leisure-card-grid">
            {sportActivities.map((activity) => (
              <article key={activity.id} className="leisure-card">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <div className="leisure-card-actions">
                  <Button
                    type="button"
                    size="sm"
                    loading={savingId === activity.id}
                    onClick={() => void handleAddToPlanning(activity.id)}
                  >
                    Ajouter au planning
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={favoriteIds.has(activity.id) ? "primary" : "secondary"}
                    onClick={() => void handleToggleFavorite(activity.id, "sport")}
                  >
                    {favoriteIds.has(activity.id) ? "★ Favori" : "☆ Favori"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="leisure-space-section">
          <h2>Musique</h2>
          <p className="leisure-section-intro">
            Préparation Spotify — ouverture manuelle uniquement, jamais de lancement automatique.
          </p>
          <div className="leisure-card-grid">
            {MUSIC_PLAYLISTS.map((playlist) => (
              <article key={playlist.id} className="leisure-card leisure-card-music">
                <h3>{playlist.title}</h3>
                <p>{playlist.description}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => openSpotify(playlist.spotifyUrl)}
                >
                  Ouvrir Spotify
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="leisure-space-section">
          <h2>Loisirs</h2>
          <p className="leisure-section-intro">
            Bibliothèque évolutive — lecture, jeux, promenade, cuisine et plus.
          </p>
          <div className="leisure-card-grid">
            {leisureActivities.map((activity) => (
              <article key={activity.id} className="leisure-card">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <div className="leisure-card-tags">
                  {activity.tags.map((tag) => (
                    <span key={tag} className="leisure-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="leisure-card-actions">
                  <Button
                    type="button"
                    size="sm"
                    loading={savingId === activity.id}
                    onClick={() => void handleAddToPlanning(activity.id)}
                  >
                    Ajouter au planning
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={favoriteIds.has(activity.id) ? "primary" : "secondary"}
                    onClick={() => void handleToggleFavorite(activity.id, "leisure")}
                  >
                    {favoriteIds.has(activity.id) ? "★ Favori" : "☆ Favori"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {favorites.length > 0 && (
          <section className="leisure-space-section">
            <h2>Mes favoris</h2>
            <ul className="leisure-favorites-list">
              {favorites.map((favorite) => {
                const activity = LEISURE_ACTIVITIES.find(
                  (item) => item.id === favorite.activity_id,
                );
                return (
                  <li key={favorite.id}>
                    <span>{favorite.custom_label ?? activity?.title ?? favorite.activity_id}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        activity ? void handleAddToPlanning(activity.id) : undefined
                      }
                    >
                      Planifier
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

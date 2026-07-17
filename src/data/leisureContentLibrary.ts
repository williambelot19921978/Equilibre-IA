import type { LeisureActivity, MusicPlaylist } from "../types/leisure";

export const MUSIC_PLAYLISTS: MusicPlaylist[] = [
  {
    id: "favorites",
    title: "Playlists favorites",
    description: "Tes playlists enregistrées — ouverture manuelle uniquement.",
    mood: "favorites",
    spotifyUrl: "https://open.spotify.com/collection/tracks",
  },
  {
    id: "calm",
    title: "Musique calme",
    description: "Ambiance douce pour se détendre.",
    mood: "calm",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY",
  },
  {
    id: "motivation",
    title: "Motivation",
    description: "Énergie positive sans surcharge.",
    mood: "motivation",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX0UrRvztWcAU",
  },
  {
    id: "sport",
    title: "Sport",
    description: "Rythme entraînant pour bouger.",
    mood: "sport",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX76Wl6C0kLrZ",
  },
  {
    id: "focus",
    title: "Concentration",
    description: "Fond sonore pour étudier ou réviser.",
    mood: "focus",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6",
  },
];

export const LEISURE_ACTIVITIES: LeisureActivity[] = [
  {
    id: "sport-mobility-15",
    category: "sport",
    title: "Mobilité — 15 min",
    description: "Épaules, hanches et colonne en douceur.",
    durationMinutes: 15,
    tags: ["sport", "mobilité"],
    sportType: "mobility",
  },
  {
    id: "sport-strength-20",
    category: "sport",
    title: "Renforcement — 20 min",
    description: "Circuit court sans matériel.",
    durationMinutes: 20,
    tags: ["sport", "renforcement"],
    sportType: "strength",
  },
  {
    id: "sport-walk-30",
    category: "sport",
    title: "Marche — 30 min",
    description: "Sortie légère en plein air ou sur tapis.",
    durationMinutes: 30,
    tags: ["sport", "marche"],
    sportType: "walk",
  },
  {
    id: "sport-yoga-20",
    category: "sport",
    title: "Yoga — 20 min",
    description: "Enchaînement doux et respiration.",
    durationMinutes: 20,
    tags: ["sport", "yoga"],
    sportType: "yoga",
  },
  {
    id: "sport-run-25",
    category: "sport",
    title: "Course — 25 min",
    description: "Footing adapté à ton énergie.",
    durationMinutes: 25,
    tags: ["sport", "course"],
    sportType: "run",
  },
  {
    id: "leisure-reading-30",
    category: "leisure",
    title: "Lecture",
    description: "Un chapitre ou quelques pages sans pression.",
    durationMinutes: 30,
    tags: ["lecture", "calme"],
  },
  {
    id: "leisure-board-games-45",
    category: "leisure",
    title: "Jeux de société",
    description: "Moment ludique en famille ou entre amis.",
    durationMinutes: 45,
    tags: ["famille", "jeux"],
  },
  {
    id: "leisure-walk-30",
    category: "leisure",
    title: "Promenade",
    description: "Marche tranquille pour déconnecter.",
    durationMinutes: 30,
    tags: ["promenade", "extérieur"],
  },
  {
    id: "leisure-cooking-40",
    category: "leisure",
    title: "Cuisine",
    description: "Préparer un plat simple ou un dessert.",
    durationMinutes: 40,
    tags: ["cuisine"],
  },
  {
    id: "leisure-diy-45",
    category: "leisure",
    title: "Bricolage",
    description: "Petit projet maison ou réparation.",
    durationMinutes: 45,
    tags: ["bricolage"],
  },
  {
    id: "leisure-photo-30",
    category: "leisure",
    title: "Photographie",
    description: "Capturer un moment ou une balade photo.",
    durationMinutes: 30,
    tags: ["photographie", "créatif"],
  },
  {
    id: "leisure-drawing-25",
    category: "leisure",
    title: "Dessin",
    description: "Croquis ou coloriage relaxant.",
    durationMinutes: 25,
    tags: ["dessin", "créatif"],
  },
  {
    id: "leisure-cinema-120",
    category: "leisure",
    title: "Cinéma",
    description: "Film ou série — temps protégé.",
    durationMinutes: 120,
    tags: ["cinéma", "repos"],
  },
  {
    id: "leisure-family-game-30",
    category: "leisure",
    title: "Jeu avec les enfants",
    description: "Activité simple et partagée.",
    durationMinutes: 30,
    tags: ["famille", "enfants"],
  },
  {
    id: "leisure-calm-20",
    category: "leisure",
    title: "Temps calme",
    description: "Sans écran — respiration ou silence.",
    durationMinutes: 20,
    tags: ["repos", "calme"],
  },
];

export function getLeisureActivityById(id: string): LeisureActivity | undefined {
  return LEISURE_ACTIVITIES.find((activity) => activity.id === id);
}

export function getLeisureActivitiesByCategory(
  category: LeisureActivity["category"],
): LeisureActivity[] {
  return LEISURE_ACTIVITIES.filter((activity) => activity.category === category);
}

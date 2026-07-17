export type LeisureCategory = "sport" | "music" | "leisure";

export type LeisureActivityId = string;

export type LeisureActivity = {
  id: LeisureActivityId;
  category: LeisureCategory;
  title: string;
  description: string;
  durationMinutes: number;
  tags: string[];
  sportType?: string;
  spotifyPlaylist?: string;
};

export type MusicPlaylist = {
  id: string;
  title: string;
  description: string;
  mood: "calm" | "motivation" | "sport" | "focus" | "favorites";
  spotifyUrl: string;
};

export type LeisureFavoriteRecord = {
  id: string;
  user_id: string;
  household_id: string;
  activity_id: string;
  category: LeisureCategory;
  custom_label: string | null;
  created_at: string;
};

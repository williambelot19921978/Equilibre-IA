/**
 * Types des tables Supabase (schéma documenté dans supabase/migrations/).
 * Génération manuelle Sprint 0 — à remplacer par `supabase gen types` quand la CLI est branchée.
 */

export type ProfileRecord = {
  id: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type HouseholdMemberRecord = {
  household_id: string;
  user_id: string;
  display_name: string;
  role?: string;
};

export type ChildRecord = {
  id: string;
  household_id: string;
  first_name: string;
  birth_date: string | null;
  created_at?: string;
};

export type TaskStatus =
  | "todo"
  | "planned"
  | "in_progress"
  | "done"
  | "skipped"
  | "cancelled";

export type TaskRecord = {
  id: string;
  household_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string | null;
  category: string;
  estimated_minutes: number | null;
  due_at: string | null;
  priority: number;
  splittable: boolean;
  status: TaskStatus;
  skip_count: number;
  cancellation_count?: number;
  consecutive_cancellations?: number;
  last_cancelled_at?: string | null;
  last_completed_at?: string | null;
  created_at: string;
  updated_at?: string;
};

export type ProfileFactValue = {
  value?: string | number | string[] | null;
  start?: string | null;
  end?: string | null;
  wake_time?: string | null;
  bed_time?: string | null;
  [key: string]: unknown;
};

export type ProfileFactRecord = {
  fact_key: string;
  fact_value: ProfileFactValue;
};

export type ProfileFactInsert = {
  household_id: string;
  user_id: string;
  fact_key: string;
  fact_value: ProfileFactValue;
  source?: string;
  confidence?: number;
  last_asked_at?: string;
  updated_at?: string;
};

import type { CalendarItemType } from "../config/calendarItemTypes";

export type { CalendarItemType };

export type CalendarItemDetails = {
  explanation?: string;
  facts?: string[];
  confidence?: "estimated" | "certain";
  status?: "proposed" | "accepted" | "completed";
  constraintType?: string;
  segmentIndex?: number;
  segmentTotal?: number;
  energyLevel?: string;
  blockType?: string;
  [key: string]: unknown;
};

export type CalendarItemRecord = {
  id: string;
  household_id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  item_type: CalendarItemType;
  starts_at: string;
  ends_at: string;
  locked: boolean;
  source: string;
  details: CalendarItemDetails | null;
  created_at: string;
  updated_at: string;
};

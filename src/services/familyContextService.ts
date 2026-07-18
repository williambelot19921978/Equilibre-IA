import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type {
  FamilyContextImpact,
  FamilyContextPeriodInput,
  FamilyContextPeriodRecord,
  FamilyContextStatus,
} from "../types/familyContext";
import { getCurrentHouseholdId } from "./householdService";

export const FATIGUE_DAY_CONTEXT_TITLE = "Journée allégée — fatigue";
export const QUIET_EVENING_CONTEXT_TITLE = "Soirée tranquille";

const TABLE = "family_context_periods";

const PERIOD_SELECT = `
  id,
  household_id,
  user_id,
  context_type,
  title,
  starts_at,
  ends_at,
  affected_member_id,
  impact,
  description,
  status,
  created_by,
  created_at,
  updated_at
`;

export async function loadFamilyContextPeriods(
  householdId: string,
): Promise<FamilyContextPeriodRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(PERIOD_SELECT)
    .eq("household_id", householdId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data ?? []).map(normalizePeriod);
}

export async function loadActiveAndFuturePeriods(
  householdId: string,
): Promise<FamilyContextPeriodRecord[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .select(PERIOD_SELECT)
    .eq("household_id", householdId)
    .eq("status", "active")
    .gte("ends_at", now)
    .order("starts_at", { ascending: true });

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error });
  }

  return (data ?? []).map(normalizePeriod);
}

export async function createFamilyContextPeriod({
  userId,
  period,
}: {
  userId: string;
  period: FamilyContextPeriodInput;
}): Promise<FamilyContextPeriodRecord> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      household_id: householdId,
      user_id: period.userId ?? null,
      context_type: period.contextType,
      title: period.title.trim(),
      starts_at: period.startsAt,
      ends_at: period.endsAt,
      affected_member_id: period.affectedMemberId ?? null,
      impact: period.impact ?? {},
      description: period.description ?? null,
      status: "active",
      created_by: userId,
      updated_at: new Date().toISOString(),
    })
    .select(PERIOD_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "INSERT", error });
  }

  return normalizePeriod(data);
}

export async function upsertDayScopedFamilyContextPeriod({
  userId,
  period,
  matchTitle,
}: {
  userId: string;
  period: FamilyContextPeriodInput;
  matchTitle: string;
}): Promise<FamilyContextPeriodRecord> {
  const householdId = await getCurrentHouseholdId(userId);

  const { data: existingRows, error: selectError } = await supabase
    .from(TABLE)
    .select(PERIOD_SELECT)
    .eq("household_id", householdId)
    .eq("title", matchTitle)
    .eq("status", "active")
    .eq("starts_at", period.startsAt)
    .eq("ends_at", period.endsAt)
    .limit(1);

  if (selectError) {
    throw formatSupabaseError({ table: TABLE, operation: "SELECT", error: selectError });
  }

  const existing = existingRows?.[0];
  if (existing) {
    return updateFamilyContextPeriod({
      periodId: existing.id,
      period: {
        contextType: period.contextType,
        title: period.title,
        startsAt: period.startsAt,
        endsAt: period.endsAt,
        userId: period.userId,
        affectedMemberId: period.affectedMemberId,
        description: period.description,
        impact: period.impact,
      },
    });
  }

  return createFamilyContextPeriod({ userId, period });
}

export async function updateFamilyContextPeriod({
  periodId,
  period,
}: {
  periodId: string;
  period: Partial<FamilyContextPeriodInput> & { status?: FamilyContextStatus };
}): Promise<FamilyContextPeriodRecord> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (period.title !== undefined) payload.title = period.title.trim();
  if (period.contextType !== undefined) payload.context_type = period.contextType;
  if (period.startsAt !== undefined) payload.starts_at = period.startsAt;
  if (period.endsAt !== undefined) payload.ends_at = period.endsAt;
  if (period.userId !== undefined) payload.user_id = period.userId;
  if (period.affectedMemberId !== undefined) {
    payload.affected_member_id = period.affectedMemberId;
  }
  if (period.description !== undefined) payload.description = period.description;
  if (period.impact !== undefined) payload.impact = period.impact;
  if (period.status !== undefined) payload.status = period.status;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", periodId)
    .select(PERIOD_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPDATE", error });
  }

  return normalizePeriod(data);
}

export async function cancelFamilyContextPeriod(
  periodId: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", periodId);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "UPDATE", error });
  }
}

export async function deleteFamilyContextPeriod(
  periodId: string,
): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", periodId);

  if (error) {
    throw formatSupabaseError({ table: TABLE, operation: "DELETE", error });
  }
}

function normalizePeriod(
  row: FamilyContextPeriodRecord,
): FamilyContextPeriodRecord {
  return {
    ...row,
    impact: (row.impact ?? {}) as FamilyContextImpact,
  };
}

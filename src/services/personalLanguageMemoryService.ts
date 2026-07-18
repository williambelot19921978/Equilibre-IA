import { supabase } from "../lib/supabase/client";
import { formatSupabaseError } from "../lib/supabase/formatError";
import type { NlpIntent } from "../types/nlp";
import type {
  LanguageContextFingerprint,
  LanguageExpressionMemory,
  LanguageExpressionStatus,
  LanguageLearningEventType,
} from "../ai/languageMemory/types";

const EXPRESSIONS_TABLE = "user_language_expressions";
const EVENTS_TABLE = "language_learning_events";

type ExpressionRow = {
  id: string;
  user_id: string;
  normalized_expression: string;
  original_examples: unknown;
  resolved_intent: string;
  resolved_meaning: string;
  confidence: number;
  confirmation_count: number;
  rejection_count: number;
  usage_count: number;
  contexts: unknown;
  status: LanguageExpressionStatus;
  created_at: string;
  last_used_at: string | null;
  last_confirmed_at: string | null;
  updated_at: string;
};

const EXPRESSION_SELECT = `
  id,
  user_id,
  normalized_expression,
  original_examples,
  resolved_intent,
  resolved_meaning,
  confidence,
  confirmation_count,
  rejection_count,
  usage_count,
  contexts,
  status,
  created_at,
  last_used_at,
  last_confirmed_at,
  updated_at
`;

function parseExamples(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseContexts(value: unknown): LanguageContextFingerprint[] {
  if (!Array.isArray(value)) return [];
  return value as LanguageContextFingerprint[];
}

export function mapExpressionRow(row: ExpressionRow): LanguageExpressionMemory {
  return {
    id: row.id,
    userId: row.user_id,
    normalizedExpression: row.normalized_expression,
    originalExamples: parseExamples(row.original_examples),
    resolvedIntent: row.resolved_intent as NlpIntent,
    resolvedMeaning: row.resolved_meaning,
    confidence: Number(row.confidence),
    confirmationCount: row.confirmation_count,
    rejectionCount: row.rejection_count,
    usageCount: row.usage_count,
    contexts: parseContexts(row.contexts),
    status: row.status,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    lastConfirmedAt: row.last_confirmed_at,
    updatedAt: row.updated_at,
  };
}

function mapExpressionToRow(memory: LanguageExpressionMemory): Omit<ExpressionRow, "created_at"> {
  return {
    id: memory.id.startsWith("temp-") ? crypto.randomUUID() : memory.id,
    user_id: memory.userId,
    normalized_expression: memory.normalizedExpression,
    original_examples: memory.originalExamples,
    resolved_intent: memory.resolvedIntent,
    resolved_meaning: memory.resolvedMeaning,
    confidence: memory.confidence,
    confirmation_count: memory.confirmationCount,
    rejection_count: memory.rejectionCount,
    usage_count: memory.usageCount,
    contexts: memory.contexts,
    status: memory.status,
    last_used_at: memory.lastUsedAt,
    last_confirmed_at: memory.lastConfirmedAt,
    updated_at: memory.updatedAt,
  };
}

export async function loadUserLanguageExpressions(
  userId: string,
): Promise<LanguageExpressionMemory[]> {
  const { data, error } = await supabase
    .from(EXPRESSIONS_TABLE)
    .select(EXPRESSION_SELECT)
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    throw formatSupabaseError({ table: EXPRESSIONS_TABLE, operation: "SELECT", error });
  }

  return (data ?? []).map((row) => mapExpressionRow(row as ExpressionRow));
}

export async function upsertLanguageExpression(
  memory: LanguageExpressionMemory,
): Promise<LanguageExpressionMemory> {
  const payload = mapExpressionToRow(memory);
  const isNew = memory.id.startsWith("temp-");

  if (isNew) {
    const { data, error } = await supabase
      .from(EXPRESSIONS_TABLE)
      .insert({
        user_id: payload.user_id,
        normalized_expression: payload.normalized_expression,
        original_examples: payload.original_examples,
        resolved_intent: payload.resolved_intent,
        resolved_meaning: payload.resolved_meaning,
        confidence: payload.confidence,
        confirmation_count: payload.confirmation_count,
        rejection_count: payload.rejection_count,
        usage_count: payload.usage_count,
        contexts: payload.contexts,
        status: payload.status,
        last_used_at: payload.last_used_at,
        last_confirmed_at: payload.last_confirmed_at,
        updated_at: payload.updated_at,
      })
      .select(EXPRESSION_SELECT)
      .single();

    if (error) {
      throw formatSupabaseError({ table: EXPRESSIONS_TABLE, operation: "INSERT", error });
    }

    return mapExpressionRow(data as ExpressionRow);
  }

  const { data, error } = await supabase
    .from(EXPRESSIONS_TABLE)
    .update({
      original_examples: payload.original_examples,
      resolved_intent: payload.resolved_intent,
      resolved_meaning: payload.resolved_meaning,
      confidence: payload.confidence,
      confirmation_count: payload.confirmation_count,
      rejection_count: payload.rejection_count,
      usage_count: payload.usage_count,
      contexts: payload.contexts,
      status: payload.status,
      last_used_at: payload.last_used_at,
      last_confirmed_at: payload.last_confirmed_at,
      updated_at: payload.updated_at,
    })
    .eq("id", payload.id)
    .eq("user_id", userIdGuard(memory.userId))
    .select(EXPRESSION_SELECT)
    .single();

  if (error) {
    throw formatSupabaseError({ table: EXPRESSIONS_TABLE, operation: "UPDATE", error });
  }

  return mapExpressionRow(data as ExpressionRow);
}

function userIdGuard(userId: string): string {
  return userId;
}

export async function deleteLanguageExpressionForTests({
  userId,
  normalizedExpression,
}: {
  userId: string;
  normalizedExpression: string;
}): Promise<void> {
  const { error } = await supabase
    .from(EXPRESSIONS_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("normalized_expression", normalizedExpression);

  if (error) {
    throw formatSupabaseError({ table: EXPRESSIONS_TABLE, operation: "DELETE", error });
  }
}

export async function recordLanguageLearningEvent({
  userId,
  expressionId,
  eventType,
  payload = {},
}: {
  userId: string;
  expressionId: string | null;
  eventType: LanguageLearningEventType;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from(EVENTS_TABLE).insert({
    user_id: userId,
    expression_id: expressionId,
    event_type: eventType,
    payload,
  });

  if (error) {
    throw formatSupabaseError({ table: EVENTS_TABLE, operation: "INSERT", error });
  }
}

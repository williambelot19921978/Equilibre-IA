/**
 * Outcome semantics — Sprint A4.
 * Prudent interpretation: observation ≠ correlation ≠ causality.
 */

import type { OutcomeEventType } from '../../contracts/events/outcome-events.ts';

export type EvidenceType =
  | 'explicit_user_action'
  | 'implicit_ui_action'
  | 'system_record'
  | 'user_feedback';

export type CorrelationStatus =
  | 'correlated'
  | 'missing_trace'
  | 'missing_proposal'
  | 'not_applicable';

export type OutcomeSemantics = {
  readonly meaning: string;
  readonly notMeaning: readonly string[];
  readonly evidenceType: EvidenceType;
  readonly interpretationLimits: readonly string[];
  readonly defaultValence: 'neutral' | 'positive_signal' | 'negative_signal' | 'unknown';
  readonly isExplicitFeedback: boolean;
};

export const A4_SUPPORTED_EVENT_TYPES = [
  'proposal.presented',
  'proposal.accepted',
  'proposal.rejected',
  'proposal.dismissed',
  'task.completed',
  'task.skipped',
  'task.rescheduled',
  'user.reported_helpful',
  'user.reported_unhelpful',
] as const satisfies readonly OutcomeEventType[];

export type A4SupportedEventType = (typeof A4_SUPPORTED_EVENT_TYPES)[number];

export function isA4SupportedEventType(
  type: OutcomeEventType,
): type is A4SupportedEventType {
  return (A4_SUPPORTED_EVENT_TYPES as readonly string[]).includes(type);
}

const SEMANTICS: Record<A4SupportedEventType, OutcomeSemantics> = {
  'proposal.presented': {
    meaning: "La proposition a été présentée à l'utilisateur",
    notMeaning: ["L'utilisateur a accepté", "La proposition était pertinente"],
    evidenceType: 'implicit_ui_action',
    interpretationLimits: ['presentation_only', 'no_outcome_inference'],
    defaultValence: 'neutral',
    isExplicitFeedback: false,
  },
  'proposal.accepted': {
    meaning: "L'utilisateur a accepté la proposition",
    notMeaning: ['La proposition était bonne', 'La recommandation a réussi'],
    evidenceType: 'explicit_user_action',
    interpretationLimits: ['acceptance_not_success', 'no_causality'],
    defaultValence: 'positive_signal',
    isExplicitFeedback: false,
  },
  'proposal.rejected': {
    meaning: "L'utilisateur a refusé explicitement la proposition",
    notMeaning: ['Échec de vie', 'Proposition mauvaise objectivement'],
    evidenceType: 'explicit_user_action',
    interpretationLimits: ['rejection_not_failure', 'no_causality'],
    defaultValence: 'negative_signal',
    isExplicitFeedback: false,
  },
  'proposal.dismissed': {
    meaning: "L'utilisateur a fermé ou ignoré la proposition sans acceptation explicite",
    notMeaning: ['Rejet explicite', 'Refus confirmé'],
    evidenceType: 'implicit_ui_action',
    interpretationLimits: ['dismiss_not_reject', 'no_negative_inference'],
    defaultValence: 'neutral',
    isExplicitFeedback: false,
  },
  'task.completed': {
    meaning: 'La tâche a été déclarée terminée',
    notMeaning: ['La recommandation a été efficace', 'Amélioration de vie démontrée'],
    evidenceType: 'system_record',
    interpretationLimits: ['completion_not_effectiveness', 'no_causality'],
    defaultValence: 'neutral',
    isExplicitFeedback: false,
  },
  'task.skipped': {
    meaning: 'La tâche a été sautée ou annulée',
    notMeaning: ['Échec personnel', 'Recommandation invalide'],
    evidenceType: 'system_record',
    interpretationLimits: ['skip_not_failure', 'no_causality'],
    defaultValence: 'neutral',
    isExplicitFeedback: false,
  },
  'task.rescheduled': {
    meaning: 'La tâche a été replanifiée',
    notMeaning: ['Échec', 'Rejet de la proposition originale'],
    evidenceType: 'system_record',
    interpretationLimits: ['reschedule_not_failure', 'no_causality'],
    defaultValence: 'neutral',
    isExplicitFeedback: false,
  },
  'user.reported_helpful': {
    meaning: "L'utilisateur a signalé explicitement que c'était utile",
    notMeaning: ['Efficacité objective démontrée'],
    evidenceType: 'user_feedback',
    interpretationLimits: ['subjective_positive', 'no_causality'],
    defaultValence: 'positive_signal',
    isExplicitFeedback: true,
  },
  'user.reported_unhelpful': {
    meaning: "L'utilisateur a signalé explicitement que ce n'était pas utile",
    notMeaning: ['Échec objectif démontré'],
    evidenceType: 'user_feedback',
    interpretationLimits: ['subjective_negative', 'no_causality'],
    defaultValence: 'negative_signal',
    isExplicitFeedback: true,
  },
};

export function getOutcomeSemantics(type: A4SupportedEventType): OutcomeSemantics {
  return SEMANTICS[type];
}

export function buildSignalType(
  eventType: A4SupportedEventType,
  evidenceType: EvidenceType,
  correlationStatus: CorrelationStatus,
): string {
  return `outcome:${eventType}:${evidenceType}:${correlationStatus}`;
}

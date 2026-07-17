import type { ChildcareMode } from "./childcare";

export type FamilyContextType =
  | "user_vacation"
  | "children_vacation"
  | "work_travel"
  | "partner_absent"
  | "partner_present"
  | "solo_parent"
  | "child_absent"
  | "child_sick"
  | "school_closed"
  | "exceptional_childcare"
  | "exceptional_work_hours"
  | "family_event"
  | "other";

export type FamilyContextStatus = "active" | "cancelled";

export type FamilyContextImpact = {
  disableWork?: boolean;
  disableSchoolDeparture?: boolean;
  maxFillRatio?: number;
  reducePersonalTasks?: boolean;
  avoidLongTasks?: boolean;
  onlyMicroTasks?: boolean;
  unavailableUserIds?: string[];
  /** Sprint 3.1 — overrides ponctuels via NLP */
  forceWorkDay?: boolean;
  workStartOverride?: string;
  workEndOverride?: string;
  /** Sprint 4.5 — mode de garde pendant vacances enfants */
  childcareMode?: ChildcareMode;
  /** Sprint 4.8.1 — exceptions travail partielles */
  workExceptionType?: import("../lib/work/workExceptionTypes").WorkExceptionType;
  affectedPeriod?: import("../lib/work/workExceptionTypes").WorkAffectedPeriod;
  workExceptionSource?: "user" | "conversation";
  workExceptionReason?: string;
};

export type FamilyContextPeriodRecord = {
  id: string;
  household_id: string;
  user_id: string | null;
  context_type: FamilyContextType;
  title: string;
  starts_at: string;
  ends_at: string;
  affected_member_id: string | null;
  impact: FamilyContextImpact;
  description: string | null;
  status: FamilyContextStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ResolvedFamilyContext = {
  activePeriods: FamilyContextPeriodRecord[];
  disableWork: boolean;
  disableSchoolDeparture: boolean;
  maxFillRatio: number;
  soloParentWithChildren: boolean;
  childSick: boolean;
  childrenVacation: boolean;
  userVacation: boolean;
  childcareMode?: ChildcareMode | null;
  onlyMicroTasks: boolean;
  unavailableUserIds: string[];
  adaptations: string[];
  warnings: string[];
};

export type FamilyContextPeriodInput = {
  contextType: FamilyContextType;
  title: string;
  startsAt: string;
  endsAt: string;
  userId?: string | null;
  affectedMemberId?: string | null;
  description?: string | null;
  impact?: FamilyContextImpact;
};

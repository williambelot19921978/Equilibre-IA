import type { ActivityType } from "../config/activityTypes";

export type AdjustmentScope = "today" | "period" | "recurring";

export type ManualBlockAdjustment = {
  blockId: string;
  originalStartsAt: string;
  originalEndsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  reason?: string;
  scope: AdjustmentScope;
  createdBy: string;
  createdAt: string;
};

export type TimelineBlockEditInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  locked: boolean;
  comment?: string;
  scope: AdjustmentScope;
  activityType?: ActivityType;
  adjustment: ManualBlockAdjustment;
};

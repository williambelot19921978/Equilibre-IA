import type { ReactNode } from "react";

import type { HomeWidgetId } from "../../../types/homePreferences";
import { MotivationWidget } from "./MotivationWidget";
import { CompactCalendarWidget } from "./CompactCalendarWidget";
import { TodayTimelineWidget } from "./TodayTimelineWidget";
import { NextActivityWidget } from "./NextActivityWidget";
import { FamilyContextWidget } from "./FamilyContextWidget";
import { MemoryInsightsWidget } from "./MemoryInsightsWidget";
import type { HomeWidgetContext } from "./types";

type HomeWidgetRendererProps = {
  widgetId: HomeWidgetId;
  context: HomeWidgetContext;
};

export function HomeWidgetRenderer({
  widgetId,
  context,
}: HomeWidgetRendererProps): ReactNode {
  switch (widgetId) {
    case "motivation":
      return <MotivationWidget context={context} />;
    case "calendar":
      return <CompactCalendarWidget context={context} />;
    case "today_timeline":
      return <TodayTimelineWidget context={context} />;
    case "next_activity":
      return <NextActivityWidget context={context} />;
    case "family_context":
    case "vacations":
      return <FamilyContextWidget context={context} />;
    case "memory_insights":
    case "profile_progress":
    case "ai_suggestions":
      return <MemoryInsightsWidget context={context} widgetId={widgetId} />;
    case "important_tasks":
    case "spiritual_space":
    case "weather":
    case "week_summary":
      return null;
    default:
      return null;
  }
}

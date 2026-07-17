import { buildDayConstraints, generateDayPlan } from "../../ai/planningEngine";
import { enrichPlanningContextWithLife } from "../../ai/lifeEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { CalendarItemRecord, DayPlan } from "../../types";
import type { LifeContext } from "../../types/lifeContext";
import { calendarItemToPlannedBlock } from "./calendarBlockMapping";
import {
  buildDisplayedDayTimeline,
  type DayTimelineEntry,
} from "./displayedDayTimeline";

export function mergePersistedIntoDisplayPlan({
  generatedPlan,
  persistedItems,
}: {
  generatedPlan: DayPlan;
  persistedItems: CalendarItemRecord[];
}): DayPlan {
  if (persistedItems.length === 0) {
    return generatedPlan;
  }

  const persistedBlocks = persistedItems.map(calendarItemToPlannedBlock);
  const structuralBlocks = generatedPlan.blocks.filter(
    (block) => block.blockType === "constraint" && block.source === "engine",
  );
  const manualBlocks = persistedBlocks.filter((block) => block.source === "manual");
  const autoBlocks = persistedBlocks.filter(
    (block) => block.blockType === "task" || block.blockType === "buffer",
  );
  const marginBlocks = persistedBlocks.filter((block) => block.blockType === "margin");

  const manualIds = new Set(manualBlocks.map((block) => block.id));
  const withoutDuplicateManual = generatedPlan.blocks.filter(
    (block) => !(block.source === "manual" && manualIds.has(block.id)),
  );

  const displayBlocks = [
    ...structuralBlocks,
    ...manualBlocks,
    ...autoBlocks.length > 0
      ? autoBlocks
      : withoutDuplicateManual.filter((block) => block.blockType === "task" || block.blockType === "buffer"),
  ].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return {
    ...generatedPlan,
    blocks: displayBlocks,
    margins:
      marginBlocks.length > 0 ? marginBlocks : generatedPlan.margins,
  };
}

export function buildDisplayDayView({
  date,
  context,
  tasks,
  persistedItems,
  sportProposalOverrides,
  taskActivityEvents = [],
}: {
  date: string;
  context: PlanningContext;
  tasks: Parameters<typeof generateDayPlan>[0]["tasks"];
  persistedItems: CalendarItemRecord[];
  sportProposalOverrides?: Record<string, import("../../types/workoutSession").WorkoutSession>;
  taskActivityEvents?: import("../../types/taskActivity").TaskActivityEventRecord[];
}): {
  plan: DayPlan;
  timeline: DayTimelineEntry[];
  lifeContext: LifeContext;
} {
  const lockedItems = persistedItems.filter((item) => item.locked);

  const preliminaryContext = enrichPlanningContextWithLife(
    context,
    lockedItems,
  );

  const { displayConstraints, incompleteData, ignoredCalendarItems } =
    buildDayConstraints({
      date,
      context: preliminaryContext,
      existingItems: lockedItems,
    });

  const enrichedContext = enrichPlanningContextWithLife(
    preliminaryContext,
    lockedItems,
    displayConstraints,
    {
      workoutDetectionItems: persistedItems,
      taskActivityEvents,
    },
  );

  const generated = generateDayPlan({
    date,
    context: enrichedContext,
    tasks,
    existingItems: lockedItems,
  });

  const lifeContext = enrichedContext.lifeContext!;

  const plan = mergePersistedIntoDisplayPlan({
    generatedPlan: {
      ...generated.plan,
      incompleteData: [
        ...incompleteData,
        ...generated.plan.incompleteData.filter(
          (item) => !incompleteData.includes(item),
        ),
      ],
      ignoredCalendarItems,
      contextAdaptations: [
        ...(generated.plan.contextAdaptations ?? []),
        ...lifeContext.reasoning,
      ],
    },
    persistedItems,
  });

  const timeline = buildDisplayedDayTimeline({
    constraints: displayConstraints,
    persistedItems,
    adultBedTime: context.bedTime,
    date,
    lifeContext,
    planningContext: enrichedContext,
    eveningPlanningMode: context.eveningPlanningMode,
    sportPreferences: context.sportSettings,
    sportProposalOverrides,
  });

  return { plan, timeline, lifeContext };
}

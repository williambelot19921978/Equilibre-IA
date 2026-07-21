import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanningContext } from "../../ai/memoryEngine";
import {
  getOutcomeObservationRuntime,
  resetOutcomeObservationRuntime,
} from "../../ai/outcome/outcomeObservationRuntime";
import { isPersonalSignal } from "../../ai/contracts/privacy/personal-signal.ts";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import {
  buildStudyRescheduleProposal,
  revalidateStudyRescheduleProposal,
} from "./buildStudyRescheduleProposal";
import {
  findAlternativeStudySlots,
  pickBestAlternativeSlot,
} from "./findAlternativeStudySlots";
import {
  formatStudyRescheduleConflictMessage,
  formatStudyRescheduleNoSolutionMessage,
} from "./formatStudyRescheduleMessage";
import { isStudyTimelineEntry } from "./isStudyTimelineEntry";
import {
  confirmStudyRescheduleMove,
  dismissStudyRescheduleProposal,
  presentStudyRescheduleProposal,
  searchStudyRescheduleProposal,
} from "./studyRescheduleService";
import { isSmartStudyReschedulingEnabled } from "../../config/featureFlags";

vi.mock("../../services/blockActionService", () => ({
  applyBlockAction: vi.fn(),
}));

import { applyBlockAction } from "../../services/blockActionService";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const TEST_DATE = "2026-07-13";
const NOW = new Date(`${TEST_DATE}T14:05:00`);

function atTime(hours: number, minutes: number): string {
  return new Date(
    `${TEST_DATE}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`,
  ).toISOString();
}

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [],
  childrenCount: 0,
  wakeTime: "06:30",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "studies",
  onboardingCompleted: true,
  profile: {
    eveningRoutine: [],
    workDays: ["monday"],
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
    sportMusic: [],
    restPreferences: [],
    faithImportance: "disabled",
    faithContent: [],
    studiesActive: true,
    preferredFocusMinutes: 30,
    studyBestPeriod: "evening",
  },
  childRoutines: [],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 45,
  },
  familyContext: {
    activePeriods: [],
    disableWork: false,
    disableSchoolDeparture: false,
    maxFillRatio: 0.8,
    soloParentWithChildren: false,
    childSick: false,
    onlyMicroTasks: false,
    childrenVacation: false,
    userVacation: false,
    unavailableUserIds: [],
    adaptations: [],
    warnings: [],
  },
  familyContextPeriods: [],
  targetDate: TEST_DATE,
  currentUserId: "user-1",
};

function makeStudyEntry(
  overrides: Partial<DayTimelineEntry> = {},
): DayTimelineEntry {
  return {
    id: "study-1",
    visualType: "task",
    title: "Révision naturopathie",
    startsAt: atTime(14, 0),
    endsAt: atTime(14, 30),
    locked: false,
    origin: "persisted",
    blockKind: "task",
    activityType: "revision",
    calendarItemId: "ci-study-1",
    completed: false,
    ...overrides,
  };
}

function makeBlockingEntry(
  id: string,
  startsAt: string,
  endsAt: string,
  overrides: Partial<DayTimelineEntry> = {},
): DayTimelineEntry {
  return {
    id,
    visualType: "appointment",
    title: "Rendez-vous",
    startsAt,
    endsAt,
    locked: false,
    origin: "persisted",
    blockKind: "appointment",
    completed: false,
    ...overrides,
  };
}

function buildOpenAfternoonTimeline(): DayTimelineEntry[] {
  return [
    makeStudyEntry(),
    makeBlockingEntry("block-1", atTime(15, 0), atTime(16, 0)),
  ];
}

describe("P2 eligibility", () => {
  it("1. a study task can trigger the search", () => {
    expect(isStudyTimelineEntry(makeStudyEntry())).toBe(true);

    const result = searchStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      entry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      userId: "user-1",
      now: NOW,
    });

    expect(result.kind).toBe("proposal");
  });

  it("rejects non-study entries", () => {
    const sportEntry = makeStudyEntry({
      id: "sport-1",
      activityType: "sport",
      visualType: "sport",
    });

    expect(isStudyTimelineEntry(sportEntry)).toBe(false);
    expect(
      buildStudyRescheduleProposal({
        timeline: [sportEntry],
        movingEntry: sportEntry,
        planningContext: baseContext,
        date: TEST_DATE,
        now: NOW,
      }).kind,
    ).toBe("not_eligible");
  });
});

describe("P2 slot search — deterministic scheduling", () => {
  it("2. proposes a valid alternative slot", () => {
    const result = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(result.kind).toBe("proposal");
    if (result.kind !== "proposal") return;

    expect(result.proposal.alternative.startsAt).toBeTruthy();
    expect(result.proposal.message).toContain("minutes");
  });

  it("3. preserves the original task duration", () => {
    const result = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(result.kind).toBe("proposal");
    if (result.kind !== "proposal") return;

    expect(result.proposal.durationMinutes).toBe(30);
    const slotMinutes =
      (new Date(result.proposal.alternative.endsAt).getTime() -
        new Date(result.proposal.alternative.startsAt).getTime()) /
      60_000;
    expect(slotMinutes).toBe(30);
  });

  it("4. never proposes overlapping slots", () => {
    const timeline = buildOpenAfternoonTimeline();
    const result = buildStudyRescheduleProposal({
      timeline,
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(result.kind).toBe("proposal");
    if (result.kind !== "proposal") return;

    const { startsAt, endsAt } = result.proposal.alternative;
    const overlaps = timeline
      .filter((entry) => entry.id !== "study-1" && entry.blockKind !== "free_slot")
      .some(
        (entry) =>
          new Date(startsAt).getTime() < new Date(entry.endsAt).getTime() &&
          new Date(entry.startsAt).getTime() < new Date(endsAt).getTime(),
      );

    expect(overlaps).toBe(false);
  });

  it("5. locked events block candidate slots", () => {
    const timeline = [
      makeStudyEntry(),
      makeBlockingEntry("mid-afternoon", atTime(14, 30), atTime(16, 0)),
      makeBlockingEntry(
        "locked-block",
        atTime(16, 0),
        atTime(17, 0),
        { locked: true, blockKind: "structural", visualType: "work" },
      ),
      makeBlockingEntry("fill-evening", atTime(17, 0), atTime(21, 30)),
    ];

    const result = buildStudyRescheduleProposal({
      timeline,
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(result.kind).toBe("no_solution");
  });

  it("6. no available slot returns a controlled message", () => {
    const timeline = [
      makeStudyEntry(),
      makeBlockingEntry("fill-1", atTime(14, 20), atTime(22, 0)),
    ];

    const result = buildStudyRescheduleProposal({
      timeline,
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(result.kind).toBe("no_solution");
    if (result.kind !== "no_solution") return;

    expect(result.message).toBe(formatStudyRescheduleNoSolutionMessage());
    expect(result.message).toContain("horaire actuel");
  });

  it("7. exposes only one option to the user", () => {
    const candidates = findAlternativeStudySlots({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(candidates.length).toBeGreaterThan(1);

    const best = pickBestAlternativeSlot(candidates);
    const result = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(result.kind).toBe("proposal");
    if (result.kind !== "proposal") return;

    expect(result.proposal.alternative.startsAt).toBe(best?.startsAt);
  });
});

describe("P2 confirmation and outcomes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "true");
    resetOutcomeObservationRuntime();
  });

  it("8. Déplacer applies the reschedule via blockActionService", async () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    vi.mocked(applyBlockAction).mockResolvedValueOnce({
      explanation: "J'ai déplacé « Révision naturopathie ».",
      timeline: buildOpenAfternoonTimeline(),
    });

    const moveResult = await confirmStudyRescheduleMove({
      userId: "user-1",
      date: TEST_DATE,
      householdId: "household-1",
      proposal: proposalResult.proposal,
      timeline: buildOpenAfternoonTimeline(),
      planningContext: baseContext,
      now: NOW,
    });

    expect(moveResult.ok).toBe(true);
    expect(applyBlockAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "reschedule",
        rescheduleOption: "custom",
        customDateTime: proposalResult.proposal.alternative.startsAt,
      }),
    );
  });

  it("9. proposal.accepted is emitted on confirm; task.rescheduled via service", async () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    vi.mocked(applyBlockAction).mockResolvedValueOnce({
      explanation: "Déplacé",
      timeline: buildOpenAfternoonTimeline(),
    });

    await confirmStudyRescheduleMove({
      userId: "user-1",
      date: TEST_DATE,
      householdId: "household-1",
      proposal: proposalResult.proposal,
      timeline: buildOpenAfternoonTimeline(),
      planningContext: baseContext,
      now: NOW,
    });

    const metrics = getOutcomeObservationRuntime().observability.snapshot();
    expect(metrics.eventsReceived).toBeGreaterThanOrEqual(1);
    expect(applyBlockAction).toHaveBeenCalled();
  });

  it("18. failed move does not rely on task.rescheduled from P2 layer", async () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    vi.mocked(applyBlockAction).mockRejectedValueOnce(new Error("network"));

    const moveResult = await confirmStudyRescheduleMove({
      userId: "user-1",
      date: TEST_DATE,
      householdId: "household-1",
      proposal: proposalResult.proposal,
      timeline: buildOpenAfternoonTimeline(),
      planningContext: baseContext,
      now: NOW,
    });

    expect(moveResult.ok).toBe(false);
  });

  it("10. keep current schedule is a no-op at service level", () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    expect(() =>
      revalidateStudyRescheduleProposal(proposalResult.proposal, {
        timeline: buildOpenAfternoonTimeline(),
        planningContext: baseContext,
        date: TEST_DATE,
        now: NOW,
      }),
    ).not.toThrow();
    expect(applyBlockAction).not.toHaveBeenCalled();
  });

  it("11. dismiss does not reschedule", () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    dismissStudyRescheduleProposal(
      proposalResult.proposal,
      "user-1",
      "household-1",
    );

    expect(applyBlockAction).not.toHaveBeenCalled();
  });

  it("12. proposal.presented on display", () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    presentStudyRescheduleProposal(
      proposalResult.proposal,
      "user-1",
      "household-1",
    );

    const metrics = getOutcomeObservationRuntime().observability.snapshot();
    expect(metrics.eventsReceived).toBeGreaterThanOrEqual(1);
  });

  it("14. proposal.dismissed is distinct from business rejection", () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    presentStudyRescheduleProposal(
      proposalResult.proposal,
      "user-1",
      "household-1",
    );
    dismissStudyRescheduleProposal(
      proposalResult.proposal,
      "user-1",
      "household-1",
    );

    const signals = getOutcomeObservationRuntime().signalSink.listAll();
    expect(signals.every((signal) => isPersonalSignal(signal))).toBe(true);
    expect(signals.every((signal) => signal.route === "personal_only")).toBe(
      true,
    );
  });

  it("15. revalidates slot before execution", async () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    const stillValid = revalidateStudyRescheduleProposal(
      proposalResult.proposal,
      {
        timeline: buildOpenAfternoonTimeline(),
        planningContext: baseContext,
        date: TEST_DATE,
        now: NOW,
      },
    );

    expect(stillValid).toBe(true);
  });

  it("16. conflict after proposal blocks the move", async () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    const occupiedTimeline = [
      ...buildOpenAfternoonTimeline(),
      makeBlockingEntry(
        "new-block",
        proposalResult.proposal.alternative.startsAt,
        proposalResult.proposal.alternative.endsAt,
      ),
    ];

    const moveResult = await confirmStudyRescheduleMove({
      userId: "user-1",
      date: TEST_DATE,
      householdId: "household-1",
      proposal: proposalResult.proposal,
      timeline: occupiedTimeline,
      planningContext: baseContext,
      now: NOW,
    });

    expect(moveResult.ok).toBe(false);
    if (moveResult.ok) return;

    expect(moveResult.message).toBe(formatStudyRescheduleConflictMessage());
    expect(applyBlockAction).not.toHaveBeenCalled();
  });

  it("17. outcome observation failure does not block the move", async () => {
    const proposalResult = buildStudyRescheduleProposal({
      timeline: buildOpenAfternoonTimeline(),
      movingEntry: makeStudyEntry(),
      planningContext: baseContext,
      date: TEST_DATE,
      now: NOW,
    });

    expect(proposalResult.kind).toBe("proposal");
    if (proposalResult.kind !== "proposal") return;

    vi.spyOn(
      await import("../../ai/outcome/outcomeObservationBridge"),
      "observePilotProposalAccepted",
    ).mockImplementation(() => {
      throw new Error("observation down");
    });

    vi.mocked(applyBlockAction).mockResolvedValueOnce({
      explanation: "Déplacé",
      timeline: buildOpenAfternoonTimeline(),
    });

    const moveResult = await confirmStudyRescheduleMove({
      userId: "user-1",
      date: TEST_DATE,
      householdId: "household-1",
      proposal: proposalResult.proposal,
      timeline: buildOpenAfternoonTimeline(),
      planningContext: baseContext,
      now: NOW,
    });

    expect(moveResult.ok).toBe(true);
  });
});

describe("P2 vertical journey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "true");
    resetOutcomeObservationRuntime();
  });

  it("planned task → unavailability → search → recommendation → confirm → move → observation", async () => {
    const entry = makeStudyEntry();
    const timeline = buildOpenAfternoonTimeline();

    const search = searchStudyRescheduleProposal({
      timeline,
      entry,
      planningContext: baseContext,
      date: TEST_DATE,
      userId: "user-1",
      now: NOW,
    });

    expect(search.kind).toBe("proposal");
    if (search.kind !== "proposal") return;

    presentStudyRescheduleProposal(
      search.proposal,
      "user-1",
      "household-1",
    );

    vi.mocked(applyBlockAction).mockResolvedValueOnce({
      explanation: "J'ai déplacé « Révision naturopathie ».",
      timeline,
    });

    const move = await confirmStudyRescheduleMove({
      userId: "user-1",
      date: TEST_DATE,
      householdId: "household-1",
      proposal: search.proposal,
      timeline,
      planningContext: baseContext,
      now: NOW,
    });

    expect(move.ok).toBe(true);
    expect(
      getOutcomeObservationRuntime().observability.snapshot().eventsReceived,
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("P2 boundaries — flag, P1 coexistence, architecture", () => {
  it("19. feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_P2_SMART_RESCHEDULING", undefined);
    expect(isSmartStudyReschedulingEnabled()).toBe(false);
  });

  it("19b. disabled flag hides smart reschedule button wiring", () => {
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");
    expect(menu).toContain("showSmartReschedule");
    expect(menu).toContain("Je ne peux pas maintenant");
  });

  it("20. P1 recommendation files remain intact", () => {
    expect(readSrc("lib/recommendations/buildStudySlotRecommendation.ts")).toContain(
      "buildStudySlotRecommendation",
    );
    expect(readSrc("pages/PlanningPage.tsx")).toContain(
      "useStudySlotRecommendation",
    );
  });

  it("21. UI components do not import scheduling engines", () => {
    const card = readSrc("components/rescheduling/StudyRescheduleProposalCard.tsx");
    const menu = readSrc("components/planning/BlockActionsMenu.tsx");

    expect(card).not.toContain("findAlternativeStudySlots");
    expect(card).not.toContain("validatePlannedBlockCore");
    expect(menu).not.toContain("buildStudyRescheduleProposal");
  });

  it("22. no new outcome event types or motors in P2 layer", () => {
    const service = readSrc("lib/rescheduling/studyRescheduleService.ts");
    expect(service).toContain("observePilotProposalPresented");
    expect(service).toContain("observePilotProposalAccepted");
    expect(service).toContain("observePilotProposalDismissed");
    expect(service).not.toContain("new OutcomeEventType");
    expect(readSrc("lib/rescheduling/buildStudyRescheduleProposal.ts")).not.toContain(
      "Engine #21",
    );
  });
});

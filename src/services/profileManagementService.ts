import type { ProfileFactRecord } from "../types";
import { upsertProfileFacts } from "./profileFactsService";
import { saveBaseProfileFacts } from "./profileService";
import { getProfileFacts } from "./profileFactsService";

export async function loadUserProfileFacts(
  userId: string,
): Promise<ProfileFactRecord[]> {
  return getProfileFacts(userId);
}

export async function saveProfileSectionFacts({
  userId,
  facts,
}: {
  userId: string;
  facts: Array<{ key: string; value: Record<string, unknown> }>;
}): Promise<void> {
  if (facts.length === 0) return;

  await upsertProfileFacts({
    userId,
    facts: facts.map((fact) => ({
      fact_key: fact.key,
      fact_value: fact.value,
    })),
    source: "profile_page",
  });
}

export async function saveIdentityProfile({
  userId,
  partnerName,
  workStart,
  workEnd,
  wakeTime,
  bedTime,
  mainPriority,
}: {
  userId: string;
  partnerName: string;
  workStart: string;
  workEnd: string;
  wakeTime: string;
  bedTime: string;
  mainPriority: string;
}): Promise<void> {
  await saveBaseProfileFacts({
    userId,
    partnerName,
    workStart,
    workEnd,
    wakeTime,
    bedTime,
    mainPriority,
  });
}

export function getFactDisplayValue(
  facts: ProfileFactRecord[],
  key: string,
): string {
  const fact = facts.find((item) => item.fact_key === key);
  if (!fact) return "Non renseigné";

  const value = fact.fact_value;

  if (typeof value?.value === "string" || typeof value?.value === "number") {
    return String(value.value);
  }

  if (typeof value?.start === "string" && typeof value?.end === "string") {
    return `${value.start} – ${value.end}`;
  }

  if (
    typeof value?.wake_time === "string" &&
    typeof value?.bed_time === "string"
  ) {
    return `Réveil ${value.wake_time}, coucher ${value.bed_time}`;
  }

  if (Array.isArray(value?.value)) {
    return value.value.join(", ");
  }

  return JSON.stringify(value);
}

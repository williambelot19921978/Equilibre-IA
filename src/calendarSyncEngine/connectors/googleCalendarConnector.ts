/**
 * EPIC 5B — Google Calendar connector (official API via Edge Functions).
 * All Google logic confined here — Planning Engine never calls Google directly.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { CalendarConnectorResult } from "../../planningCalendarEngine/contract/calendarConnector";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnection,
  loadExternalEventsForDate,
  startGoogleCalendarAuth,
  syncGoogleCalendar,
} from "../../services/googleCalendarService";
import { externalEventToCalendarItem } from "../mappers/externalEventMapper";
import { mapConnectionToOAuthSession } from "../oauth/oauthSession";

export const GOOGLE_WRITE_SCOPE_REQUIRED =
  "Écriture Google Calendar — scope calendar.events requis (EPIC futur).";

export type GoogleCalendarConnectorDeps = {
  readonly getConnection: typeof getGoogleCalendarConnection;
  readonly startAuth: typeof startGoogleCalendarAuth;
  readonly sync: typeof syncGoogleCalendar;
  readonly disconnect: typeof disconnectGoogleCalendar;
  readonly loadEvents: typeof loadExternalEventsForDate;
  readonly invokeMutate?: (input: {
    operation: "create" | "update" | "delete";
    householdId: string;
    item?: CalendarItem;
    eventId?: string;
  }) => Promise<{ success: boolean; message: string }>;
};

export type GoogleCalendarConnectorContext = {
  readonly userId: string;
  readonly householdId: string;
};

export class GoogleCalendarConnector {
  readonly id = "google";
  readonly label = "Google Calendar";

  private readonly deps: GoogleCalendarConnectorDeps;
  private context: GoogleCalendarConnectorContext | null = null;

  constructor(deps: GoogleCalendarConnectorDeps) {
    this.deps = deps;
  }

  setContext(context: GoogleCalendarConnectorContext): void {
    this.context = context;
  }

  private requireContext(): GoogleCalendarConnectorContext {
    if (!this.context) {
      throw new Error("Contexte Google Calendar requis (userId, householdId).");
    }
    return this.context;
  }

  async connect(redirectAfter = "/settings/calendars"): Promise<CalendarConnectorResult> {
    const { householdId } = this.requireContext();
    try {
      const { authUrl } = await this.deps.startAuth({ householdId, redirectAfter });
      return {
        success: true,
        message: "Redirection OAuth initiée.",
        items: [],
        redirectUrl: authUrl,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connexion impossible.",
      };
    }
  }

  async disconnect(): Promise<CalendarConnectorResult> {
    const { householdId } = this.requireContext();
    try {
      await this.deps.disconnect({ householdId });
      return { success: true, message: "Google Calendar déconnecté." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Déconnexion impossible.",
      };
    }
  }

  async fetchEvents(range: { start: string; end: string }): Promise<CalendarConnectorResult> {
    const { userId, householdId } = this.requireContext();
    const date = range.start.slice(0, 10);

    try {
      const records = await this.deps.loadEvents({ userId, householdId, date });
      const items = records.map((record) => externalEventToCalendarItem(record));
      return {
        success: true,
        message: `${items.length} événement(s) chargé(s).`,
        items,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Chargement impossible.",
      };
    }
  }

  async pullSync(force = false): Promise<CalendarConnectorResult & { synced?: number }> {
    const { userId, householdId } = this.requireContext();
    try {
      const result = await this.deps.sync({ householdId, userId, force });
      return {
        success: true,
        message: result.message ?? `${result.synced} événement(s) synchronisé(s).`,
        synced: result.synced,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Synchronisation échouée.",
      };
    }
  }

  async createEvent(item: CalendarItem): Promise<CalendarConnectorResult> {
    return this.mutate("create", item);
  }

  async updateEvent(item: CalendarItem): Promise<CalendarConnectorResult> {
    return this.mutate("update", item);
  }

  async deleteEvent(eventId: string): Promise<CalendarConnectorResult> {
    return this.mutate("delete", undefined, eventId);
  }

  async pushChanges(items: readonly CalendarItem[]): Promise<CalendarConnectorResult> {
    if (items.length === 0) {
      return { success: true, message: "Aucune modification à pousser." };
    }
    return {
      success: false,
      message: `${items.length} modification(s) mise(s) en file — ${GOOGLE_WRITE_SCOPE_REQUIRED}`,
    };
  }

  async watch(): Promise<CalendarConnectorResult> {
    return {
      success: false,
      message: "Google Calendar watch channels — architecture préparée, non activée.",
    };
  }

  async getOAuthSession() {
    const { userId, householdId } = this.requireContext();
    const connection = await this.deps.getConnection(userId, householdId);
    return mapConnectionToOAuthSession(connection);
  }

  private async mutate(
    operation: "create" | "update" | "delete",
    item?: CalendarItem,
    eventId?: string,
  ): Promise<CalendarConnectorResult> {
    const { householdId } = this.requireContext();

    if (this.deps.invokeMutate) {
      const result = await this.deps.invokeMutate({ operation, householdId, item, eventId });
      return { success: result.success, message: result.message };
    }

    return {
      success: false,
      message: GOOGLE_WRITE_SCOPE_REQUIRED,
    };
  }
}

export function createGoogleCalendarConnector(
  deps?: Partial<GoogleCalendarConnectorDeps>,
): GoogleCalendarConnector {
  return new GoogleCalendarConnector({
    getConnection: getGoogleCalendarConnection,
    startAuth: startGoogleCalendarAuth,
    sync: syncGoogleCalendar,
    disconnect: disconnectGoogleCalendar,
    loadEvents: loadExternalEventsForDate,
    ...deps,
  });
}

export const defaultGoogleCalendarConnector = createGoogleCalendarConnector();

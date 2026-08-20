import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import {
  CalendarConflictError,
  type CalendarBusyPeriod,
  type CalendarMeeting,
  type CalendarMeetingRequest,
  type CalendarSchedulingGateway,
} from "@/application/ports/calendar-scheduling-gateway";
/*
 * Google Calendar has no atomic "check free/busy then insert" operation. A
 * deterministic event ID per slot lets concurrent assistant requests collide
 * safely at insert time instead of creating overlapping meetings.
 */
class GoogleCalendarRequestError extends Error {
  constructor(readonly status: number) {
    super(`Google Calendar request failed: ${status}`);
    this.name = "GoogleCalendarRequestError";
  }
}

const accessTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive().optional(),
});

const freeBusyResponseSchema = z.object({
  calendars: z.record(
    z.string(),
    z.object({
      busy: z.array(z.object({ start: z.string(), end: z.string() })),
      errors: z.array(z.unknown()).optional(),
    }),
  ),
});

const eventSchema = z.object({
  id: z.string().min(1),
  htmlLink: z.string().url(),
  hangoutLink: z.string().url().optional(),
  start: z.object({ dateTime: z.string() }),
  end: z.object({ dateTime: z.string() }),
  conferenceData: z
    .object({
      createRequest: z
        .object({
          status: z.object({ statusCode: z.string() }).optional(),
        })
        .optional(),
      entryPoints: z
        .array(
          z.object({
            entryPointType: z.string(),
            uri: z.string().url(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const eventListSchema = z.object({ items: z.array(eventSchema).default([]) });

interface GoogleCalendarSchedulingGatewayOptions {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
  readonly calendarId: string;
  readonly eventTitle: string;
  /** Overrides production backoff only for deterministic adapter tests. */
  readonly conferencePollDelaysMs?: readonly number[];
}

const DEFAULT_CONFERENCE_POLL_DELAYS_MS = [250, 500, 750, 1_000, 1_500, 2_000];

export class GoogleCalendarSchedulingGateway implements CalendarSchedulingGateway {
  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly options: GoogleCalendarSchedulingGatewayOptions) {}

  async findByBookingKey(bookingKey: string): Promise<CalendarMeeting | null> {
    const query = new URLSearchParams({
      privateExtendedProperty: `opsalchemyBookingKey=${bookingKey}`,
      maxResults: "1",
      singleEvents: "true",
    });
    const response = await this.calendarFetch(
      `/calendars/${encodeURIComponent(this.options.calendarId)}/events?${query}`,
    );
    const parsed = eventListSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Invalid Google Calendar event list.");
    return parsed.data.items[0]
      ? await this.resolveMeeting(parsed.data.items[0])
      : null;
  }

  async isAvailable(startTime: string, endTime: string): Promise<boolean> {
    return (await this.getBusyPeriods(startTime, endTime)).length === 0;
  }

  async getBusyPeriods(
    startTime: string,
    endTime: string,
  ): Promise<readonly CalendarBusyPeriod[]> {
    const response = await this.calendarFetch("/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: startTime,
        timeMax: endTime,
        items: [{ id: this.options.calendarId }],
      }),
    });
    const parsed = freeBusyResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Invalid Google Calendar free/busy result.");
    const calendar = parsed.data.calendars[this.options.calendarId];
    if (!calendar || calendar.errors?.length) {
      throw new Error("Google Calendar availability could not be determined.");
    }
    return calendar.busy.map((period) => ({
      startTime: period.start,
      endTime: period.end,
    }));
  }

  async createMeeting(request: CalendarMeetingRequest): Promise<CalendarMeeting> {
    const query = new URLSearchParams({
      conferenceDataVersion: "1",
      sendUpdates: "all",
    });
    const slotEventId = createHash("sha256")
      .update(`${this.options.calendarId}:${request.startTime}:${request.endTime}`)
      .digest("hex");
    let response: Response;
    try {
      response = await this.calendarFetch(
        `/calendars/${encodeURIComponent(this.options.calendarId)}/events?${query}`,
        {
          method: "POST",
          body: JSON.stringify({
            id: slotEventId,
            summary: this.options.eventTitle,
            description:
              "Consultation scheduled through the OPSAlchemy website assistant.",
            start: { dateTime: request.startTime, timeZone: request.timeZone },
            end: { dateTime: request.endTime, timeZone: request.timeZone },
            attendees: [
              {
                email: request.attendeeEmail,
                displayName: request.attendeeName,
                responseStatus: "needsAction",
              },
            ],
            conferenceData: {
              createRequest: {
                requestId: request.bookingKey,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
            extendedProperties: {
              private: { opsalchemyBookingKey: request.bookingKey },
            },
          }),
        },
      );
    } catch (error) {
      if (!(error instanceof GoogleCalendarRequestError) || error.status !== 409) {
        throw error;
      }
      const existing = await this.findByBookingKey(request.bookingKey);
      if (existing) return existing;
      throw new CalendarConflictError();
    }
    const parsed = eventSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Invalid Google Calendar created event.");
    return this.resolveMeeting(parsed.data);
  }

  private async resolveMeeting(
    initialEvent: z.infer<typeof eventSchema>,
  ): Promise<CalendarMeeting> {
    let event = initialEvent;
    const delays =
      this.options.conferencePollDelaysMs ?? DEFAULT_CONFERENCE_POLL_DELAYS_MS;

    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      const meetLink =
        event.hangoutLink ??
        event.conferenceData?.entryPoints?.find(
          (entryPoint) => entryPoint.entryPointType === "video",
        )?.uri;
      if (meetLink) return this.toMeeting(event, meetLink);

      if (event.conferenceData?.createRequest?.status?.statusCode === "failure") {
        throw new Error("Google Meet conference creation failed.");
      }
      if (attempt === delays.length) break;

      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      const response = await this.calendarFetch(
        `/calendars/${encodeURIComponent(this.options.calendarId)}/events/${encodeURIComponent(event.id)}`,
      );
      const parsed = eventSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("Invalid Google Calendar event.");
      event = parsed.data;
    }

    throw new Error("Google Meet conference link was not ready.");
  }

  private toMeeting(
    event: z.infer<typeof eventSchema>,
    meetLink: string,
  ): CalendarMeeting {
    return {
      eventId: event.id,
      htmlLink: event.htmlLink,
      meetLink,
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
    };
  }

  private async calendarFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new GoogleCalendarRequestError(response.status);
    return response;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) {
      return this.accessToken.value;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        refresh_token: this.options.refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      throw new Error(`Google OAuth refresh failed: ${response.status}`);

    const parsed = accessTokenSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Invalid Google OAuth token response.");
    this.accessToken = {
      value: parsed.data.access_token,
      expiresAt: Date.now() + (parsed.data.expires_in ?? 3_600) * 1_000,
    };
    return this.accessToken.value;
  }
}

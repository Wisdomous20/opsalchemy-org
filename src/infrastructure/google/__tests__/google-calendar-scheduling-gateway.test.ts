import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleCalendarSchedulingGateway } from "../google-calendar-scheduling-gateway";

vi.mock("server-only", () => ({}));

const request = {
  bookingKey: "a".repeat(64),
  attendeeEmail: "visitor@example.com",
  attendeeName: "Visitor Name",
  startTime: "2026-09-01T10:00:00+08:00",
  endTime: "2026-09-01T10:30:00+08:00",
  timeZone: "Asia/Shanghai",
};

const completedEvent = {
  id: "event-id",
  htmlLink: "https://calendar.google.com/event/1",
  hangoutLink: "https://meet.google.com/abc-defg-hij",
  start: { dateTime: request.startTime },
  end: { dateTime: request.endTime },
};

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function createGateway(conferencePollDelaysMs?: readonly number[]) {
  return new GoogleCalendarSchedulingGateway({
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
    calendarId: "primary",
    eventTitle: "OPSAlchemy Consultation",
    conferencePollDelaysMs,
  });
}

describe("GoogleCalendarSchedulingGateway", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("checks free/busy and creates a Meet event with an emailed invitation", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "access-token", expires_in: 3_600 }),
      )
      .mockResolvedValueOnce(jsonResponse({ calendars: { primary: { busy: [] } } }))
      .mockResolvedValueOnce(jsonResponse(completedEvent));
    vi.stubGlobal("fetch", fetchMock);
    const gateway = createGateway();

    await expect(gateway.isAvailable(request.startTime, request.endTime)).resolves.toBe(
      true,
    );
    await expect(gateway.createMeeting(request)).resolves.toMatchObject({
      meetLink: completedEvent.hangoutLink,
    });

    const insertCall = fetchMock.mock.calls[2];
    expect(String(insertCall?.[0])).toContain("conferenceDataVersion=1");
    expect(String(insertCall?.[0])).toContain("sendUpdates=all");
    const body = JSON.parse(String(insertCall?.[1]?.body)) as {
      id: string;
      attendees: { email: string }[];
      conferenceData: { createRequest: { requestId: string } };
    };
    expect(body.id).toMatch(/^[a-f0-9]{64}$/);
    expect(body.attendees[0]?.email).toBe(request.attendeeEmail);
    expect(body.conferenceData.createRequest.requestId).toBe(request.bookingKey);
  });

  it("waits for an asynchronously created Meet link", async () => {
    const pendingEvent = {
      ...completedEvent,
      hangoutLink: undefined,
      conferenceData: {
        createRequest: { status: { statusCode: "pending" } },
      },
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "access-token", expires_in: 3_600 }),
      )
      .mockResolvedValueOnce(jsonResponse(pendingEvent))
      .mockResolvedValueOnce(jsonResponse(completedEvent));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createGateway([0]).createMeeting(request)).resolves.toMatchObject({
      meetLink: completedEvent.hangoutLink,
    });
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("/events/event-id");
  });

  it("continues polling while Google reports conference creation as pending", async () => {
    const pendingEvent = {
      ...completedEvent,
      hangoutLink: undefined,
      conferenceData: {
        createRequest: { status: { statusCode: "pending" } },
      },
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "access-token", expires_in: 3_600 }),
      )
      .mockResolvedValueOnce(jsonResponse(pendingEvent));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      fetchMock.mockResolvedValueOnce(jsonResponse(pendingEvent));
    }
    fetchMock.mockResolvedValueOnce(jsonResponse(completedEvent));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createGateway([0, 0, 0, 0, 0, 0]).createMeeting(request),
    ).resolves.toMatchObject({ meetLink: completedEvent.hangoutLink });
  });
});

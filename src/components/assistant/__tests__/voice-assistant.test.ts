import { describe, expect, it } from "vitest";
import {
  createRealtimeMessageEvent,
  createVoiceTakeoverEvent,
  getCompletedRealtimeToolCalls,
  getRealtimePlaybackLifecycle,
} from "../voice-assistant";

describe("getCompletedRealtimeToolCalls", () => {
  it("waits for response.done before executing a streamed function call", () => {
    expect(
      getCompletedRealtimeToolCalls({
        type: "response.function_call_arguments.done",
      }),
    ).toEqual([]);
  });

  it("returns completed scheduling calls from response.done", () => {
    const calls = getCompletedRealtimeToolCalls({
      type: "response.done",
      response: {
        output: [
          {
            type: "function_call",
            name: "schedule_consultation",
            call_id: "call_booking",
            arguments: '{"confirmed":true}',
          },
        ],
      },
    });

    expect(calls).toEqual([
      expect.objectContaining({
        name: "schedule_consultation",
        call_id: "call_booking",
      }),
    ]);
  });
});

describe("createRealtimeMessageEvent", () => {
  it("preserves typed user text exactly for the active voice conversation", () => {
    expect(
      createRealtimeMessageEvent({
        id: "typed-contact",
        role: "user",
        content: "Zoë Dela Cruz — zoe+consult@example.com",
      }),
    ).toEqual({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Zoë Dela Cruz — zoe+consult@example.com",
          },
        ],
      },
    });
  });

  it("replays earlier assistant text with the correct Realtime content type", () => {
    expect(
      createRealtimeMessageEvent({
        id: "prior-answer",
        role: "assistant",
        content: "What date works best?",
      }).item.content[0]?.type,
    ).toBe("text");
  });
});

describe("createVoiceTakeoverEvent", () => {
  it("starts a natural voice handoff without adding a fabricated user turn", () => {
    expect(createVoiceTakeoverEvent()).toEqual({
      type: "response.create",
      response: {
        instructions: expect.stringContaining("chosen to continue by virtual voice call"),
      },
    });
  });
});

describe("getRealtimePlaybackLifecycle", () => {
  it("keeps playback active until the WebRTC output buffer is fully drained", () => {
    expect(
      getRealtimePlaybackLifecycle({ type: "output_audio_buffer.started" }),
    ).toBe("started");
    expect(getRealtimePlaybackLifecycle({ type: "response.done" })).toBeNull();
    expect(
      getRealtimePlaybackLifecycle({ type: "output_audio_buffer.stopped" }),
    ).toBe("stopped");
  });

  it("treats an explicitly cleared output buffer as stopped", () => {
    expect(
      getRealtimePlaybackLifecycle({ type: "output_audio_buffer.cleared" }),
    ).toBe("stopped");
  });
});

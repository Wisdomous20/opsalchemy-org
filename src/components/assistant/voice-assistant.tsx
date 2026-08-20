"use client";

import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "error";

export interface VoiceTurn {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
}

interface RealtimeEvent {
  readonly type?: string;
  readonly item_id?: string;
  readonly response_id?: string;
  readonly delta?: string;
  readonly transcript?: string;
  readonly error?: { readonly message?: string };
  readonly response?: {
    readonly output?: readonly {
      readonly type?: string;
      readonly name?: string;
      readonly call_id?: string;
      readonly arguments?: string;
    }[];
  };
}

export type RealtimePlaybackLifecycle = "started" | "stopped" | null;

export function getRealtimePlaybackLifecycle(
  event: RealtimeEvent,
): RealtimePlaybackLifecycle {
  if (event.type === "output_audio_buffer.started") return "started";
  if (
    event.type === "output_audio_buffer.stopped" ||
    event.type === "output_audio_buffer.cleared"
  )
    return "stopped";
  return null;
}

const REALTIME_TOOL_NAMES = new Set([
  "search_opsalchemy_knowledge",
  "schedule_consultation",
  "find_consultation_slots",
]);

export function getCompletedRealtimeToolCalls(event: RealtimeEvent) {
  if (event.type !== "response.done") return [];
  return (
    event.response?.output?.filter(
      (item) =>
        item.type === "function_call" &&
        typeof item.name === "string" &&
        REALTIME_TOOL_NAMES.has(item.name) &&
        item.call_id,
    ) ?? []
  );
}

interface VoiceAssistantProps {
  readonly conversationId: string;
  readonly controllerRef: Ref<VoiceAssistantHandle>;
  readonly history: readonly VoiceTurn[];
  readonly onTurn: (turn: VoiceTurn) => void;
  readonly onStatusChange: (status: VoiceStatus) => void;
  readonly onTextFallback: () => void;
}

export type VoiceTextSendResult = "sent" | "busy" | "disconnected";

export interface VoiceAssistantHandle {
  sendText(turn: VoiceTurn): VoiceTextSendResult;
}

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "Voice is ready",
  connecting: "Connecting securely…",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  disconnected: "Voice conversation ended",
  error: "Voice is unavailable",
};

function parseToolQuery(argumentsJson: string | undefined): string | null {
  if (!argumentsJson) return null;
  try {
    const value: unknown = JSON.parse(argumentsJson);
    if (!value || typeof value !== "object" || !("query" in value)) return null;
    const query = (value as { query?: unknown }).query;
    return typeof query === "string" && query.trim() ? query.trim() : null;
  } catch {
    return null;
  }
}

function parseScheduleToolArguments(
  argumentsJson: string | undefined,
): Record<string, unknown> | null {
  if (!argumentsJson) return null;
  try {
    const value: unknown = JSON.parse(argumentsJson);
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function createRealtimeMessageEvent(turn: VoiceTurn) {
  return {
    type: "conversation.item.create",
    item: {
      type: "message",
      role: turn.role,
      content: [
        turn.role === "user"
          ? { type: "input_text", text: turn.content }
          : { type: "text", text: turn.content },
      ],
    },
  };
}

export function createVoiceTakeoverEvent() {
  return {
    type: "response.create",
    response: {
      instructions:
        "The visitor has chosen to continue by virtual voice call. Briefly acknowledge the switch, then ask one useful next question based on the conversation so far. If there is no prior context, ask how you can help. Do not repeat an earlier answer.",
    },
  };
}

export function VoiceAssistant({
  conversationId,
  controllerRef,
  history,
  onTurn,
  onStatusChange,
  onTextFallback,
}: VoiceAssistantProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handledCallsRef = useRef(new Set<string>());
  const transcriptRef = useRef<VoiceTurn[]>(history.slice(-12));
  const historyRef = useRef(history);
  const responseInProgressRef = useRef(false);
  const audioPlaybackActiveRef = useRef(false);
  const startAttemptRef = useRef(0);

  function setMicrophoneCaptureEnabled(enabled: boolean) {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled && !isMutedRef.current;
    });
  }

  const updateTranscript = useCallback(
    (updater: (turns: VoiceTurn[]) => VoiceTurn[], publish = true) => {
      const current = transcriptRef.current;
      const next = updater(current);
      transcriptRef.current = next;
      if (!publish) return;
      const changed = next.find(
        (turn) =>
          !current.some(
            (existing) => existing.id === turn.id && existing.content === turn.content,
          ),
      );
      if (changed) onTurn(changed);
    },
    [onTurn],
  );

  function stopResources() {
    channelRef.current?.close();
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    channelRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
    audioRef.current = null;
    responseInProgressRef.current = false;
    audioPlaybackActiveRef.current = false;
  }

  function endVoice() {
    startAttemptRef.current += 1;
    stopResources();
    setIsMuted(false);
    isMutedRef.current = false;
    setStatus("disconnected");
  }

  function stopReply() {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== "open") return;
    if (responseInProgressRef.current) {
      channel.send(JSON.stringify({ type: "response.cancel" }));
      responseInProgressRef.current = false;
    }
    channel.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
    audioPlaybackActiveRef.current = false;
    setMicrophoneCaptureEnabled(true);
    setStatus("listening");
  }

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    onStatusChange(status);
  }, [onStatusChange, status]);

  useImperativeHandle(
    controllerRef,
    () => ({
      sendText(turn) {
        const channel = channelRef.current;
        if (!channel || channel.readyState !== "open") return "disconnected";
        if (status !== "listening") return "busy";

        channel.send(JSON.stringify(createRealtimeMessageEvent(turn)));
        updateTranscript((turns) => [...turns, turn]);
        channel.send(JSON.stringify({ type: "response.create" }));
        responseInProgressRef.current = true;
        setStatus("thinking");
        return "sent";
      },
    }),
    [status, updateTranscript],
  );

  useEffect(
    () => () => {
      startAttemptRef.current += 1;
      channelRef.current?.close();
      peerRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioRef.current) audioRef.current.srcObject = null;
    },
    [],
  );

  async function runKnowledgeTool(
    channel: RTCDataChannel,
    callId: string,
    argumentsJson: string | undefined,
  ) {
    if (handledCallsRef.current.has(callId)) return;
    handledCallsRef.current.add(callId);
    const query = parseToolQuery(argumentsJson);

    try {
      if (!query) throw new Error("invalid_tool_arguments");
      setStatus("thinking");
      const history = transcriptRef.current.slice(-12).map(({ role, content }) => ({
        role,
        content,
      }));
      const response = await fetch("/api/realtime/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, callId, query, history }),
      });
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        !("answer" in payload) ||
        typeof payload.answer !== "string"
      )
        throw new Error("knowledge_unavailable");

      channel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify({
              answer: payload.answer,
              citations:
                "citations" in payload && Array.isArray(payload.citations)
                  ? payload.citations
                  : [],
            }),
          },
        }),
      );
      channel.send(JSON.stringify({ type: "response.create" }));
    } catch {
      if (channel.readyState === "open") {
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify({
                error:
                  "The approved knowledge service is unavailable. Say that clearly and offer a text conversation or human handoff.",
              }),
            },
          }),
        );
        channel.send(JSON.stringify({ type: "response.create" }));
      }
    }
  }

  async function runSchedulingTool(
    channel: RTCDataChannel,
    callId: string,
    argumentsJson: string | undefined,
  ) {
    if (handledCallsRef.current.has(callId)) return;
    handledCallsRef.current.add(callId);
    const details = parseScheduleToolArguments(argumentsJson);

    try {
      if (!details) throw new Error("invalid_tool_arguments");
      setStatus("thinking");
      const response = await fetch("/api/realtime/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, callId, ...details }),
      });
      const payload: unknown = await response.json();
      if (response.status === 429) {
        const retryAfterSeconds = Number(response.headers.get("Retry-After") ?? "0");
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify({
                status: "rate_limited",
                retryAfterSeconds,
              }),
            },
          }),
        );
        channel.send(JSON.stringify({ type: "response.create" }));
        return;
      }
      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error("scheduling_unavailable");
      }

      channel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(payload),
          },
        }),
      );
      channel.send(JSON.stringify({ type: "response.create" }));
    } catch {
      if (channel.readyState === "open") {
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify({ status: "unavailable" }),
            },
          }),
        );
        channel.send(JSON.stringify({ type: "response.create" }));
      }
    }
  }

  async function runAvailabilityTool(
    channel: RTCDataChannel,
    callId: string,
    argumentsJson: string | undefined,
  ) {
    if (handledCallsRef.current.has(callId)) return;
    handledCallsRef.current.add(callId);
    const details = parseScheduleToolArguments(argumentsJson);

    try {
      if (!details) throw new Error("invalid_tool_arguments");
      setStatus("thinking");
      const response = await fetch("/api/realtime/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, callId, ...details }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error("availability_unavailable");
      }

      channel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(payload),
          },
        }),
      );
      channel.send(JSON.stringify({ type: "response.create" }));
    } catch {
      if (channel.readyState === "open") {
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify({ status: "unavailable" }),
            },
          }),
        );
        channel.send(JSON.stringify({ type: "response.create" }));
      }
    }
  }

  function runRealtimeTool(
    channel: RTCDataChannel,
    name: string | undefined,
    callId: string | undefined,
    argumentsJson: string | undefined,
  ) {
    if (!callId) return;
    if (name === "search_opsalchemy_knowledge") {
      void runKnowledgeTool(channel, callId, argumentsJson);
    } else if (name === "schedule_consultation") {
      void runSchedulingTool(channel, callId, argumentsJson);
    } else if (name === "find_consultation_slots") {
      void runAvailabilityTool(channel, callId, argumentsJson);
    }
  }

  function handleRealtimeEvent(channel: RTCDataChannel, event: RealtimeEvent) {
    const playbackLifecycle = getRealtimePlaybackLifecycle(event);
    if (playbackLifecycle === "started") {
      audioPlaybackActiveRef.current = true;
      setMicrophoneCaptureEnabled(false);
      setStatus("speaking");
      return;
    }
    if (playbackLifecycle === "stopped") {
      audioPlaybackActiveRef.current = false;
      setMicrophoneCaptureEnabled(true);
      setStatus("listening");
      return;
    }

    switch (event.type) {
      case "session.created":
      case "session.updated":
        setMicrophoneCaptureEnabled(true);
        setStatus("listening");
        break;
      case "input_audio_buffer.speech_started":
        setStatus((current) => (current === "speaking" ? current : "listening"));
        break;
      case "input_audio_buffer.speech_stopped":
        setStatus((current) => (current === "speaking" ? current : "thinking"));
        break;
      case "response.created":
        responseInProgressRef.current = true;
        // The UI uses an explicit Stop control instead of acoustic barge-in.
        // Pausing capture prevents speaker echo or silence hallucinations from
        // creating a competing user turn while a response/tool is in flight.
        setMicrophoneCaptureEnabled(false);
        setStatus("thinking");
        break;
      case "conversation.item.input_audio_transcription.completed": {
        const content = event.transcript?.trim();
        if (!content) break;
        updateTranscript((turns) => [
          ...turns,
          { id: event.item_id ?? crypto.randomUUID(), role: "user", content },
        ]);
        break;
      }
      case "response.output_audio_transcript.delta": {
        if (!event.delta) break;
        setStatus("speaking");
        const id = event.item_id ?? "active-assistant-response";
        updateTranscript((turns) => {
          const existingIndex = turns.findIndex((turn) => turn.id === id);
          if (existingIndex === -1)
            return [...turns, { id, role: "assistant", content: event.delta ?? "" }];
          return turns.map((turn, index) =>
            index === existingIndex
              ? { ...turn, content: `${turn.content}${event.delta ?? ""}` }
              : turn,
          );
        }, false);
        break;
      }
      case "response.output_audio_transcript.done": {
        if (!event.transcript) break;
        const id = event.item_id ?? "active-assistant-response";
        const completedTurn: VoiceTurn = {
          id,
          role: "assistant",
          content: event.transcript,
        };
        updateTranscript((turns) => {
          const exists = turns.some((turn) => turn.id === id);
          return exists
            ? turns.map((turn) => (turn.id === id ? completedTurn : turn))
            : [...turns, completedTurn];
        }, false);
        onTurn(completedTurn);
        break;
      }
      case "response.done": {
        responseInProgressRef.current = false;
        // Execute tools only after the model response is complete. Starting the
        // follow-up response from function_call_arguments.done can race the
        // still-active response and leave the voice workflow without a reply.
        const functionCalls = getCompletedRealtimeToolCalls(event);
        functionCalls.forEach((item) => {
          runRealtimeTool(channel, item.name, item.call_id, item.arguments);
        });
        // response.done only means the model finished sending. WebRTC can still
        // have audio queued; output_audio_buffer.stopped is the authoritative
        // signal that the last sentence has finished playing.
        if (functionCalls.length === 0 && !audioPlaybackActiveRef.current) {
          setMicrophoneCaptureEnabled(true);
          setStatus("listening");
        }
        break;
      }
      case "error":
        setError(
          event.error?.message
            ? "The voice service encountered an error. You can continue by text."
            : "The voice service is unavailable. You can continue by text.",
        );
        setStatus("error");
        break;
    }
  }

  async function startVoice() {
    const attempt = ++startAttemptRef.current;
    setError(null);
    transcriptRef.current = historyRef.current.slice(-12);
    handledCallsRef.current.clear();
    responseInProgressRef.current = false;
    audioPlaybackActiveRef.current = false;

    if (
      typeof RTCPeerConnection === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("This browser does not support live voice. Please continue by text.");
      setStatus("error");
      return;
    }

    setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (attempt !== startAttemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const tokenResponse = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const tokenPayload: unknown = await tokenResponse.json();
      if (attempt !== startAttemptRef.current) return;
      if (
        !tokenResponse.ok ||
        !tokenPayload ||
        typeof tokenPayload !== "object" ||
        !("clientSecret" in tokenPayload) ||
        typeof tokenPayload.clientSecret !== "string" ||
        !tokenPayload.clientSecret.startsWith("ek_")
      )
        throw new Error("session_unavailable");

      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audioRef.current = audio;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0] ?? null;
      };
      peer.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
          stopResources();
          setStatus((current) => (current === "error" ? current : "disconnected"));
        }
      };

      stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.addEventListener("open", () => {
        historyRef.current.slice(-12).forEach((turn) => {
          channel.send(JSON.stringify(createRealtimeMessageEvent(turn)));
        });
        channel.send(JSON.stringify(createVoiceTakeoverEvent()));
        responseInProgressRef.current = true;
        setMicrophoneCaptureEnabled(false);
        setStatus("thinking");
      });
      channel.addEventListener("message", (message) => {
        try {
          const event: unknown = JSON.parse(String(message.data));
          if (event && typeof event === "object")
            handleRealtimeEvent(channel, event as RealtimeEvent);
        } catch {
          setError("A voice event could not be read. You can continue by text.");
        }
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (attempt !== startAttemptRef.current) return;
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenPayload.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (attempt !== startAttemptRef.current) return;
      if (!sdpResponse.ok) throw new Error("connection_failed");
      await peer.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text(),
      });
    } catch (startError) {
      if (attempt !== startAttemptRef.current) return;
      stopResources();
      const denied =
        startError instanceof DOMException &&
        ["NotAllowedError", "PermissionDeniedError"].includes(startError.name);
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser settings or continue by text."
          : "Voice could not connect. Please try again or continue by text.",
      );
      setStatus("error");
    }
  }

  function toggleMute() {
    const nextMuted = !isMuted;
    isMutedRef.current = nextMuted;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted && status === "listening";
    });
    setIsMuted(nextMuted);
  }

  const isActive = ["connecting", "listening", "thinking", "speaking"].includes(status);

  return (
    <section
      className={`voice-assistant voice-assistant--${isActive ? "active" : "offer"}`}
      aria-label="Virtual voice call"
    >
      <div className="voice-assistant__intro">
        <div>
          <span className={`voice-status voice-status--${status}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <strong>
              {isActive ? "Virtual call with the Guide" : "Prefer a virtual call?"}
            </strong>
            <p aria-live="polite">
              {isActive
                ? STATUS_LABELS[status]
                : status === "error"
                  ? STATUS_LABELS.error
                  : "Speak live and the Guide will take over. Your chat stays in sync."}
            </p>
          </div>
        </div>
        {!isActive ? (
          <button
            type="button"
            className="voice-start"
            onClick={() => void startVoice()}
          >
            <span aria-hidden="true">◉</span>
            {status === "idle" ? "Start virtual call" : "Try virtual call again"}
          </button>
        ) : (
          <div className="voice-actions">
            {status === "speaking" && (
              <button type="button" onClick={stopReply}>
                Stop reply
              </button>
            )}
            <button
              type="button"
              onClick={toggleMute}
              disabled={status === "connecting"}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button type="button" onClick={endVoice} className="voice-end">
              End
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="voice-error" role="alert">
          {error}
        </p>
      )}

      {(isActive || status === "error") && (
        <button type="button" className="voice-fallback" onClick={onTextFallback}>
          Type names and email addresses in the message box below
        </button>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "error";

interface VoiceTurn {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
}

interface RealtimeEvent {
  readonly type?: string;
  readonly item_id?: string;
  readonly call_id?: string;
  readonly name?: string;
  readonly arguments?: string;
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

interface VoiceAssistantProps {
  readonly conversationId: string;
  readonly onTextFallback: () => void;
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

export function VoiceAssistant({
  conversationId,
  onTextFallback,
}: VoiceAssistantProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<VoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handledCallsRef = useRef(new Set<string>());
  const transcriptRef = useRef<VoiceTurn[]>([]);
  const startAttemptRef = useRef(0);

  function updateTranscript(updater: (turns: VoiceTurn[]) => VoiceTurn[]) {
    setTranscript((current) => {
      const next = updater(current);
      transcriptRef.current = next;
      return next;
    });
  }

  function stopResources() {
    channelRef.current?.close();
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    channelRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
    audioRef.current = null;
  }

  function endVoice() {
    startAttemptRef.current += 1;
    stopResources();
    setIsMuted(false);
    setStatus("disconnected");
  }

  useEffect(
    () => () => {
      startAttemptRef.current += 1;
      stopResources();
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

  function handleRealtimeEvent(channel: RTCDataChannel, event: RealtimeEvent) {
    switch (event.type) {
      case "session.created":
      case "session.updated":
        setStatus("listening");
        break;
      case "input_audio_buffer.speech_started":
        setStatus("listening");
        break;
      case "input_audio_buffer.speech_stopped":
      case "response.created":
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
        });
        break;
      }
      case "response.output_audio_transcript.done": {
        if (!event.transcript) break;
        const id = event.item_id ?? "active-assistant-response";
        updateTranscript((turns) => {
          const exists = turns.some((turn) => turn.id === id);
          return exists
            ? turns.map((turn) =>
                turn.id === id ? { ...turn, content: event.transcript ?? "" } : turn,
              )
            : [...turns, { id, role: "assistant", content: event.transcript ?? "" }];
        });
        break;
      }
      case "response.function_call_arguments.done":
        if (event.name === "search_opsalchemy_knowledge" && event.call_id)
          void runKnowledgeTool(channel, event.call_id, event.arguments);
        break;
      case "response.done": {
        const functionCalls =
          event.response?.output?.filter(
            (item) =>
              item.type === "function_call" &&
              item.name === "search_opsalchemy_knowledge" &&
              item.call_id,
          ) ?? [];
        functionCalls.forEach((item) => {
          if (item.call_id)
            void runKnowledgeTool(channel, item.call_id, item.arguments);
        });
        if (functionCalls.length === 0) setStatus("listening");
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
    setTranscript([]);
    transcriptRef.current = [];
    handledCallsRef.current.clear();

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
      channel.addEventListener("open", () => setStatus("listening"));
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
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }

  const isActive = ["connecting", "listening", "thinking", "speaking"].includes(status);

  return (
    <section className="voice-assistant" aria-label="Voice conversation">
      <div className="voice-assistant__intro">
        <div>
          <span className={`voice-status voice-status--${status}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <strong>Talk with the OPSAlchemy Guide</strong>
            <p aria-live="polite">{STATUS_LABELS[status]}</p>
          </div>
        </div>
        {!isActive ? (
          <button
            type="button"
            className="voice-start"
            onClick={() => void startVoice()}
          >
            <span aria-hidden="true">◉</span>
            {status === "idle" ? "Start voice" : "Try voice again"}
          </button>
        ) : (
          <div className="voice-actions">
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

      {transcript.length > 0 && (
        <div
          className="voice-transcript"
          aria-label="Live voice transcript"
          aria-live="polite"
        >
          {transcript.slice(-4).map((turn) => (
            <p key={turn.id}>
              <strong>{turn.role === "assistant" ? "Guide" : "You"}</strong>
              <span>{turn.content}</span>
            </p>
          ))}
        </div>
      )}

      {error && (
        <p className="voice-error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="voice-fallback" onClick={onTextFallback}>
        Prefer typing? Continue with text below
      </button>
    </section>
  );
}

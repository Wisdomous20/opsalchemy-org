import { z } from "zod";

const voiceTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
});

export const realtimeToolRequestSchema = z.object({
  conversationId: z.string().uuid(),
  callId: z.string().trim().min(1).max(200),
  query: z.string().trim().min(1).max(2_000),
  history: z.array(voiceTurnSchema).max(12).default([]),
});

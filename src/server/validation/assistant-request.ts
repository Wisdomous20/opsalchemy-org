import { z } from "zod";

const conversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
});

export const assistantRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().trim().min(1).max(2_000),
  history: z.array(conversationTurnSchema).max(12).default([]),
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

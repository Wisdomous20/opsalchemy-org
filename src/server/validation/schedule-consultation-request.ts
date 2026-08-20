import { z } from "zod";

const rfc3339WithOffset = z
  .string()
  .datetime({ offset: true, local: false, precision: 0 });

export const scheduleConsultationArgumentsSchema = z.object({
  attendeeEmail: z.string().trim().email().max(254),
  attendeeName: z.string().trim().min(1).max(100),
  startTime: rfc3339WithOffset,
  endTime: rfc3339WithOffset,
  timeZone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }),
  confirmed: z.boolean(),
});

export const scheduleConsultationRequestSchema =
  scheduleConsultationArgumentsSchema.extend({
    conversationId: z.string().uuid(),
    callId: z.string().trim().min(1).max(200),
  });

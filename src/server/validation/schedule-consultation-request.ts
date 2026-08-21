import { z } from "zod";

// Availability uses Date#toISOString, which includes `.000Z`. Accept valid
// RFC3339 fractional seconds here and normalize in the application boundary.
const rfc3339WithOffset = z.string().datetime({ offset: true, local: false });
const mobileNumber = z
  .string()
  .trim()
  .min(8)
  .max(32)
  .regex(/^\+?[0-9][0-9().\-\s]{6,30}[0-9]$/);

export const scheduleConsultationArgumentsSchema = z.object({
  attendeeEmail: z.string().trim().email().max(254),
  attendeeName: z.string().trim().min(1).max(100),
  attendeePhone: mobileNumber,
  contactConsent: z.boolean(),
  startTime: rfc3339WithOffset,
  confirmed: z.boolean(),
});

export const scheduleConsultationRequestSchema =
  scheduleConsultationArgumentsSchema.extend({
    conversationId: z.string().uuid(),
    callId: z.string().trim().min(1).max(200),
  });

export const findConsultationSlotsRequestSchema = z.object({
  conversationId: z.string().uuid(),
  callId: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

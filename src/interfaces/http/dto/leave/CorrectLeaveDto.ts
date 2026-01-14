import { z } from 'zod';

export const CorrectLeaveRequestSchema = z
  .object({
    leaveId: z.string().uuid(),
    correctedStartTime: z.string().datetime(),
    correctedEndTime: z.string().datetime(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.correctedEndTime) > new Date(data.correctedStartTime),
    {
      message: 'correctedEndTime must be after correctedStartTime',
      path: ['correctedEndTime'],
    }
  );

export type CorrectLeaveRequest = z.infer<typeof CorrectLeaveRequestSchema>;

export const CorrectLeaveResponseSchema = z.object({
  status: z.literal('corrected'),
});

export type CorrectLeaveResponse = z.infer<typeof CorrectLeaveResponseSchema>;

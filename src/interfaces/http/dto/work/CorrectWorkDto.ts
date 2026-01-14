import { z } from 'zod';

export const CorrectWorkRequestSchema = z
  .object({
    workPeriodId: z.string().uuid(),
    correctionId: z.string().uuid(),
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

export type CorrectWorkRequest = z.infer<typeof CorrectWorkRequestSchema>;

export const CorrectWorkResponseSchema = z.object({
  status: z.literal('corrected'),
});

export type CorrectWorkResponse = z.infer<typeof CorrectWorkResponseSchema>;

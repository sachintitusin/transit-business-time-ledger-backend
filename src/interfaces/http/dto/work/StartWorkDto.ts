import { z } from 'zod';

export const StartWorkRequestSchema = z.object({
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
});

export type StartWorkRequest = z.infer<typeof StartWorkRequestSchema>;

export const StartWorkResponseSchema = z.object({
  workPeriodId: z.string().uuid(),
});

export type StartWorkResponse = z.infer<typeof StartWorkResponseSchema>;

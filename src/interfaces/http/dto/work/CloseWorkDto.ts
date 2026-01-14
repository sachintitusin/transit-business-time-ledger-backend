import { z } from 'zod';

export const CloseWorkRequestSchema = z.object({
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
});

export type CloseWorkRequest = z.infer<typeof CloseWorkRequestSchema>;

export const CloseWorkResponseSchema = z.object({
  status: z.literal('closed'),
});

export type CloseWorkResponse = z.infer<typeof CloseWorkResponseSchema>;

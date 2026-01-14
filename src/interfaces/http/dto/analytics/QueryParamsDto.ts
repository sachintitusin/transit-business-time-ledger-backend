import { z } from 'zod';

export const WorkSummaryQuerySchema = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 datetime' }),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 datetime' }),
});

export type WorkSummaryQuery = z.infer<typeof WorkSummaryQuerySchema>;

export const LeaveSummaryQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type LeaveSummaryQuery = z.infer<typeof LeaveSummaryQuerySchema>;

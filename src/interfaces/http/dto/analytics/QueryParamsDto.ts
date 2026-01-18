import { z } from 'zod';

/**
 * /analytics/work
 */
export const WorkSummaryQuerySchema = z.object({
  from: z.string().datetime({
    message: 'from must be a valid ISO 8601 datetime',
  }),
  to: z.string().datetime({
    message: 'to must be a valid ISO 8601 datetime',
  }),
});

export type WorkSummaryQuery =
  z.infer<typeof WorkSummaryQuerySchema>;

/**
 * /analytics/leaves
 */
export const LeaveSummaryQuerySchema = z.object({
  from: z.string().datetime({
    message: 'from must be a valid ISO 8601 datetime',
  }),
  to: z.string().datetime({
    message: 'to must be a valid ISO 8601 datetime',
  }),
});

export type LeaveSummaryQuery =
  z.infer<typeof LeaveSummaryQuerySchema>;

/**
 * /analytics/daily
 *
 * Strict on purpose:
 * - requires from & to
 * - no defaults
 * - prevents accidental full-table scans
 */
export const DailyAnalyticsQuerySchema = z
  .object({
    from: z.string().datetime({
      message: 'from must be a valid ISO 8601 datetime',
    }),
    to: z.string().datetime({
      message: 'to must be a valid ISO 8601 datetime',
    }),
  })
  .refine(
    (data) => new Date(data.from) < new Date(data.to),
    {
      message: '`from` must be before `to`',
      path: ['from'],
    }
  );


export type DailyAnalyticsQuery =
  z.infer<typeof DailyAnalyticsQuerySchema>;

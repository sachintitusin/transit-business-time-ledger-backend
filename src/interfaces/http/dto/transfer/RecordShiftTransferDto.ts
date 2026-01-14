import { z } from 'zod';

export const RecordShiftTransferRequestSchema = z.object({
  fromDriverId: z.string().uuid(),
  toDriverId: z.string().uuid(),
  workPeriodId: z.string().uuid(),
  reason: z.string().optional(),
});


export type RecordShiftTransferRequest = z.infer<typeof RecordShiftTransferRequestSchema>;

export const RecordShiftTransferResponseSchema = z.object({
  transferId: z.string().uuid(),
});

export type RecordShiftTransferResponse = z.infer<typeof RecordShiftTransferResponseSchema>;

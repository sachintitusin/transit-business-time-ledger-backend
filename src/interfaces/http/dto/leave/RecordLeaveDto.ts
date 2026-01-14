// src/interfaces/http/dto/leave/RecordLeaveDto.ts
import { z } from 'zod';

export const RecordLeaveRequestSchema = z
  .object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    reason: z.string().optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export type RecordLeaveRequest = z.infer<typeof RecordLeaveRequestSchema>;

export const RecordLeaveResponseSchema = z.object({
  leaveId: z.string().uuid(),  // ✅ Return the generated ID
  status: z.literal('recorded'),
});

export type RecordLeaveResponse = z.infer<typeof RecordLeaveResponseSchema>;
import { z } from 'zod';

export const AuthenticateRequestSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export type AuthenticateRequest = z.infer<typeof AuthenticateRequestSchema>;

export const AuthenticateResponseSchema = z.object({
  token: z.string(),
  driverId: z.string().uuid(),
});

export type AuthenticateResponse = z.infer<typeof AuthenticateResponseSchema>;

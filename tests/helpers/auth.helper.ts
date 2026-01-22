// tests/helpers/auth.helper.ts
import { randomUUID } from 'node:crypto';
import { JwtServiceImpl } from '../../src/infrastructure/auth/JwtServiceImpl';

const jwtService = new JwtServiceImpl(
  process.env.JWT_SECRET || 'test-secret-key',
  '24h'
);

export function createAuthToken(driverId: string): string {
  return jwtService.sign({
    sub: driverId,
    driverId,
    email: `${driverId}@test.com`,
  });
}

// Valid UUID v4 values
export const TEST_DRIVER_1 = randomUUID();
export const TEST_DRIVER_2 = randomUUID();

export const TOKEN_DRIVER_1 = createAuthToken(TEST_DRIVER_1);
export const TOKEN_DRIVER_2 = createAuthToken(TEST_DRIVER_2);

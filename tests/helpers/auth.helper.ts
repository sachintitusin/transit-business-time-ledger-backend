// tests/helpers/auth.helper.ts
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
export const TEST_DRIVER_1 = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_DRIVER_2 = '6a1c0f9d-3c7e-4c0f-9b52-1d9e6f5b1a23';

export const TOKEN_DRIVER_1 = createAuthToken(TEST_DRIVER_1);
export const TOKEN_DRIVER_2 = createAuthToken(TEST_DRIVER_2);

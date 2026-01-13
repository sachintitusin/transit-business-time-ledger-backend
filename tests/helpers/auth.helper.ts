// tests/helpers/auth.helper.ts
import { JwtServiceImpl } from '../../src/infrastructure/auth/JwtServiceImpl';

const jwtService = new JwtServiceImpl(
  process.env.JWT_SECRET || 'test-secret-key',
  '24h'
);

export function createAuthToken(driverId: string): string {
  return jwtService.sign({
    sub: driverId,
    driverId: driverId,
    email: `${driverId}@test.com`,
  });
}

// ✅ Use valid UUID format (fixed for reproducibility)
export const TEST_DRIVER_1 = '11111111-1111-1111-1111-111111111111';
export const TEST_DRIVER_2 = '22222222-2222-2222-2222-222222222222';

export const TOKEN_DRIVER_1 = createAuthToken(TEST_DRIVER_1);
export const TOKEN_DRIVER_2 = createAuthToken(TEST_DRIVER_2);

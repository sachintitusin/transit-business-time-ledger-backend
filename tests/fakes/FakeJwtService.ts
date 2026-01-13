// tests/fakes/FakeJwtService.ts

import { JwtService, JwtPayload } from '../../src/application/ports/JwtService';

export class FakeJwtService implements JwtService {
  sign(payload: JwtPayload): string {
    return `fake-token-for-${payload.sub}`;
  }

  verify(token: string): JwtPayload {
    const prefix = 'fake-token-for-';
    if (!token.startsWith(prefix)) {
      throw new Error('INVALID_TOKEN');
    }

    return {
      sub: token.replace(prefix, ''),
    };
  }
}

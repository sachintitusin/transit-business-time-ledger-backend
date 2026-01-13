// tests/fakes/FakeGoogleTokenVerifier.ts

import {
  GoogleTokenVerifier,
  GoogleProfile,
} from '../../src/application/ports/GoogleTokenVerifier';
import {
  InvalidGoogleTokenError,
} from '../../src/domain/auth/AuthErrors';

export class FakeGoogleTokenVerifier implements GoogleTokenVerifier {
  async verify(idToken: string): Promise<GoogleProfile> {
    if (idToken === 'valid-google-token') {
      return {
        sub: 'google-123',
        email: 'test@gmail.com',
        name: 'Test User',
        email_verified: true,
      };
    }

    if (idToken === 'unverified-email-token') {
      return {
        sub: 'google-456',
        email: 'unverified@gmail.com',
        email_verified: false,
      };
    }

    throw new InvalidGoogleTokenError();
  }
}

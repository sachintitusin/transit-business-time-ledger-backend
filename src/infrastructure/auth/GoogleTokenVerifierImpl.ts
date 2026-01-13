// src/infrastructure/auth/GoogleTokenVerifierImpl.ts

import { OAuth2Client } from 'google-auth-library';
import {
  GoogleTokenVerifier,
  GoogleProfile,
} from '../../application/ports/GoogleTokenVerifier';
import {
  InvalidGoogleTokenError,
} from '../../domain/auth/AuthErrors';

export class GoogleTokenVerifierImpl implements GoogleTokenVerifier {
  private client: OAuth2Client;

  constructor(googleClientId: string) {
    this.client = new OAuth2Client(googleClientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.client._clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new InvalidGoogleTokenError();
      }

      return {
        sub: payload.sub!,
        email: payload.email!,
        name: payload.name,
        email_verified: payload.email_verified ?? false,
      };
    } catch {
      throw new InvalidGoogleTokenError();
    }
  }
}

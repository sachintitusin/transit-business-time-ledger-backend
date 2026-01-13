// src/domain/auth/AuthErrors.ts

import { DomainError } from '../shared/DomainError';

export class InvalidGoogleTokenError extends DomainError {
  constructor() {
    super(
      'INVALID_GOOGLE_TOKEN',
      'Google token verification failed'
    );
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor(email: string) {
    super(
      'EMAIL_NOT_VERIFIED',
      `Google email not verified: ${email}`
    );
  }
}

export class AuthIdentityConflictError extends DomainError {
  constructor(email: string) {
    super(
      'AUTH_IDENTITY_CONFLICT',
      `Auth identity already exists for email: ${email}`
    );
  }
}

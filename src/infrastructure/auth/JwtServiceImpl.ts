// src/infrastructure/auth/JwtServiceImpl.ts

import * as jwt from 'jsonwebtoken';
import { JwtService, JwtPayload } from '../../application/ports/JwtService';

export class JwtServiceImpl implements JwtService {
  constructor(
    private readonly secret: jwt.Secret,
    private readonly expiresIn: jwt.SignOptions['expiresIn'] = '1h'
  ) {}

  sign(payload: JwtPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: this.expiresIn,
      issuer: 'buzzapp-api',
      audience: 'buzzapp-client',
    };

    return jwt.sign(
      {
        sub: payload.sub,
        driverId: payload.driverId,
        email: payload.email,
      },
      this.secret,
      options
    );
  }

  verify(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'buzzapp-api',
        audience: 'buzzapp-client',
      });

      // Type guard
      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'sub' in decoded &&
        'driverId' in decoded &&
        typeof decoded.sub === 'string' &&
        typeof decoded.driverId === 'string'
      ) {
        return {
          sub: decoded.sub,
          driverId: decoded.driverId,
          email: typeof decoded.email === 'string' ? decoded.email : undefined,
        };
      }

      throw new Error('Invalid token payload');
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      throw error;
    }
  }
}

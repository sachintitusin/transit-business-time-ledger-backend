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

    return jwt.sign(payload, this.secret, options);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, {
      issuer: 'buzzapp-api',
      audience: 'buzzapp-client',
    }) as JwtPayload;
  }
}

import { TransactionManager } from '../../ports/TransactionManager';
import { GoogleTokenVerifier } from '../../ports/GoogleTokenVerifier';
import { JwtService } from '../../ports/JwtService';
import { DriverRepository } from '../../ports/DriverRepository';
import { AuthIdentityRepository } from '../../ports/AuthIdentityRepository';

import {
  InvalidGoogleTokenError,
  EmailNotVerifiedError,
} from '../../../domain/auth/AuthErrors';

import { DriverId, asDriverId } from '../../../domain/shared/types';

export class AuthenticateDriverService {
  constructor(
    private readonly txManager: TransactionManager,
    private readonly googleVerifier: GoogleTokenVerifier,
    private readonly jwtService: JwtService,
    private readonly driverRepo: DriverRepository,
    private readonly authIdentityRepo: AuthIdentityRepository
  ) {}

  async execute(
    googleIdToken: string
  ): Promise<{ driverId: DriverId; token: string }> {
    return this.txManager.run(async () => {
      // 1. Verify Google token
      const profile = await this.googleVerifier.verify(googleIdToken);

      // 2. Enforce verified email
      if (!profile.email_verified) {
        throw new EmailNotVerifiedError(profile.email);
      }

      // 3. Check existing identity
      const existingIdentity =
        await this.authIdentityRepo.findByProviderAndUserId(
          'google',
          profile.sub
        );

      let driverId: DriverId;

      if (existingIdentity) {
        driverId = existingIdentity.driverId;
      } else {
        // 4. Find or create driver
        const existingDriver =
          await this.driverRepo.findByEmail(profile.email);

        if (existingDriver) {
          driverId = existingDriver.id;
        } else {
          driverId = asDriverId(crypto.randomUUID());

          await this.driverRepo.save({
            id: driverId,
            email: profile.email,
            name: profile.name,
          });
        }

        // 5. Link auth identity
        await this.authIdentityRepo.save({
          driverId,
          provider: 'google',
          providerUserId: profile.sub,
          email: profile.email,
        });
      }

      // 6. Issue JWT
      const token = this.jwtService.sign({
        sub: driverId,
        email: profile.email,
      });

      return { driverId, token };
    });
  }
}

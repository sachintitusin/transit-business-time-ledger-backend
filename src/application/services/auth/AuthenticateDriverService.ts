import { TransactionManager } from '../../ports/TransactionManager'
import { GoogleTokenVerifier } from '../../ports/GoogleTokenVerifier'
import { JwtService } from '../../ports/JwtService'
import { DriverRepository } from '../../ports/DriverRepository'
import { AuthIdentityRepository } from '../../ports/AuthIdentityRepository'
import { AppLogger } from '../../ports/Logger'

import {
  InvalidGoogleTokenError,
  EmailNotVerifiedError,
} from '../../../domain/auth/AuthErrors'

import { DriverId, asDriverId } from '../../../domain/shared/types'

export class AuthenticateDriverService {
  constructor(
    private readonly txManager: TransactionManager,
    private readonly googleVerifier: GoogleTokenVerifier,
    private readonly jwtService: JwtService,
    private readonly driverRepo: DriverRepository,
    private readonly authIdentityRepo: AuthIdentityRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(
    googleIdToken: string
  ): Promise<{ driverId: DriverId; token: string }> {
    return this.txManager.run(async () => {
      const profile = await this.googleVerifier.verify(googleIdToken)

      if (!profile.email_verified) {
        throw new EmailNotVerifiedError(profile.email)
      }

      const existingIdentity =
        await this.authIdentityRepo.findByProviderAndUserId(
          'google',
          profile.sub
        )

      let driverId: DriverId

      if (existingIdentity) {
        driverId = existingIdentity.driverId
      } else {
        const existingDriver =
          await this.driverRepo.findByEmail(profile.email)

        if (existingDriver) {
          driverId = existingDriver.id
        } else {
          driverId = asDriverId(crypto.randomUUID())

          await this.driverRepo.save({
            id: driverId,
            email: profile.email,
            name: profile.name,
          })
        }

        await this.authIdentityRepo.save({
          driverId,
          provider: 'google',
          providerUserId: profile.sub,
          email: profile.email,
        })
      }

      const token = this.jwtService.sign({
        driverId,
        sub: driverId,
        email: profile.email,
      })

      return { driverId, token }
    })
  }
}

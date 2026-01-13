import { DriverId } from '../../domain/shared/types';

export interface AuthIdentity {
  driverId: DriverId;
  provider: 'google';
  providerUserId: string;
  email: string;
}

export interface AuthIdentityRepository {
  findByProviderAndUserId(
    provider: 'google',
    providerUserId: string
  ): Promise<AuthIdentity | null>;

  save(identity: AuthIdentity): Promise<void>;
}

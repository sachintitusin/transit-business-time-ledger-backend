import { DriverRepository } from '../../ports/DriverRepository';
import { DriverId } from '../../../domain/shared/types';
import { DomainError } from '../../../domain/shared/DomainError';
import { AppLogger } from '../../ports/Logger';

export class GetMeService {
  constructor(
    private readonly driverRepository: DriverRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(driverId: DriverId) {
    this.logger.info('GetMe invoked', { driverId });

    try {
      const driver =
        await this.driverRepository.findById(driverId);

      if (!driver) {
        throw new DomainError(
          'DRIVER_NOT_FOUND',
          'Authenticated driver not found'
        );
      }

      this.logger.info('GetMe succeeded', {
        driverId,
        email: driver.email,
      });

      return {
        id: driver.id,
        email: driver.email,
        name: driver.name,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        this.logger.warn('GetMe rejected', {
          driverId,
          code: err.code,
          message: err.message,
        });
        throw err;
      }

      this.logger.error('GetMe failed unexpectedly', {
        driverId,
        error: err,
      });
      throw err;
    }
  }
}

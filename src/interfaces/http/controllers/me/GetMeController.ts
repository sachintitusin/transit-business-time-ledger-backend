import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/AuthRequest';
import { GetMeService } from '../../../../application/services/auth/GetMeService';

export class GetMeController {
  constructor(private readonly getMeService: GetMeService) {}

  async handle(req: AuthenticatedRequest, res: Response) {
    const driverId = req.driverId!;

    const result = await this.getMeService.execute(driverId);

    res.status(200).json(result);
  }
}

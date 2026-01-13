import { Request, Response } from "express";
import { AuthenticateDriverService } from "../../../../application/services/auth/AuthenticateDriverService";


export class AuthenticateDriverController {
  constructor(
    private readonly authenticateDriverService: AuthenticateDriverService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        error: {
          code: "MISSING_ID_TOKEN",
          message: "Google ID token is required",
        },
      });
      return;
    }

    const result =
      await this.authenticateDriverService.execute(idToken);

    res.status(200).json({
      token: result.token,
    });
  }
}

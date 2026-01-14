import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export function validateQueryParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and attach to a custom property instead of overwriting req.query
      const validated = schema.parse(req.query);
      (req as any).validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

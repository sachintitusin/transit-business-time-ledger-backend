import { Request } from 'express';

export interface ValidatedRequest<TBody = any, TQuery = any> extends Request {
  validatedBody?: TBody;
  validatedQuery?: TQuery;
}

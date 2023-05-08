import { injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { HTTPBadRequestError } from '../errors/http';

@injectable()
export class RequestBodyCheckerMiddleware {
  apply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (Object.keys(req.body).length && !req.body.data) {
      return next(new HTTPBadRequestError([{ title: 'BadRequest', detail: 'Body format is incorrect' }]));
    }

    next();
  };
}

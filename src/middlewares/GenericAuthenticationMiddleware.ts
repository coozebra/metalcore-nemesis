import createHttpError from 'http-errors';

import { injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import settings from '../config/settings';

@injectable()
export class GenericAuthenticationMiddleware {
  apply = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    if (!request.headers.authorization) {
      throw new createHttpError.Unauthorized('Authorization Error');
    }

    const authenticationKey = settings.authenticationKey;
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.replace('Bearer ', '');

    if (token !== authenticationKey) {
      throw new createHttpError.Unauthorized('Invalid token');
    } else {
      next();
    }
  };
}

import { inject, injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';

import Settings from '../types/Settings';
import { UnauthorizedError } from '../errors/application';

@injectable()
export class ServerAuthenticationMiddleware {
  @inject('Settings') private settings: Settings;

  apply = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    if (!request.headers.authorization) {
      throw new UnauthorizedError('Authorization Error');
    }

    const authenticationKey = this.settings.serverAuthenticationKey;
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.replace('Bearer ', '');

    if (token !== authenticationKey) {
      throw new UnauthorizedError('Invalid token');
    } else {
      next();
    }
  };
}

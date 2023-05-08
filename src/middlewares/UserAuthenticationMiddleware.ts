import createError from 'http-errors';
import { inject, injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { SessionTicketAuthenticator } from '../services/playfab/SessionTicketAuthenticator';

@injectable()
export class UserAuthenticationMiddleware {
  @inject(SessionTicketAuthenticator) private ticketVerifier: SessionTicketAuthenticator;

  apply = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const UnauthorizedError = new createError.Unauthorized('Authorization Error');

    if (!request.headers.authorization) {
      throw UnauthorizedError;
    }

    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.replace('Bearer ', '');

    const projectAuthentication = await this.ticketVerifier.apply(token);

    if (projectAuthentication.isSessionTicketExpired) {
      throw UnauthorizedError;
    } else {
      response.locals.accountId = projectAuthentication.userInfo.accountId;
      next();
    }
  };
}

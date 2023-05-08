import express, { NextFunction, Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { ServerAuthenticationMiddleware } from '../../middlewares/ServerAuthenticationMiddleware';

import { DisplayNameFetcher } from '../../services/playfab/DisplayNameFetcher';
import { UsersRetriever } from '../../services/users/UserRetriever';

import { ObjectIdValidator } from '../../dto/validators/ObjectIdValidator';
import { UserSerializer } from '../serializers/UserSerializer';

import { InvalidInputError } from '../../errors/application';
import { HTTPBadRequestError } from '../../errors/http';

@injectable()
export class UsersController {
  @inject(DisplayNameFetcher) private displayNameFetcher: DisplayNameFetcher;
  @inject(ObjectIdValidator) private objectIdValidator: ObjectIdValidator;
  @inject(UserSerializer) private userSerializer: UserSerializer;
  @inject(UsersRetriever) private usersRetriever: UsersRetriever;

  router: express.Application;

  constructor(@inject(ServerAuthenticationMiddleware) serverAuthenticationMiddleware: ServerAuthenticationMiddleware) {
    this.router = express().get('/:gameId/users', serverAuthenticationMiddleware.apply, this.show);
  }

  private show = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { gameId } = request.params;
    const { walletAddress } = request.query;

    this.validateGameId(gameId);

    if (walletAddress) {
      const users = await this.usersRetriever.apply(gameId, walletAddress.toString());

      const displayNames = await Promise.all(
        users.map(async (user) => {
          return await this.displayNameFetcher.apply(user.accountId);
        })
      );

      response.send({ data: users.map((user, index) => this.userSerializer.apply(user, displayNames[index])) });
    } else {
      return next(new HTTPBadRequestError([{ title: 'BadRequest', detail: 'Invalid query params' }]));
    }
  };

  private validateGameId(gameId: string): void {
    const validationResult = this.objectIdValidator.apply(gameId);

    if (!validationResult.isValid) {
      throw new InvalidInputError('Invalid gameId');
    }
  }
}

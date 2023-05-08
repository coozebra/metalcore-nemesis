import express, { NextFunction, Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { Logger } from '../../types/ILogger';

import { UserResourceIncrementor } from '../../services/userResource/UserResourceIncrementor';
import { GameAuthenticationMiddleware } from '../../middlewares/GameAuthenticationMiddleware';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { HTTPBadRequestError } from '../../errors/http';

@injectable()
export class UserResourcesController {
  @inject(UserResourceIncrementor) userResourceIncrementor: UserResourceIncrementor;
  @inject(TransactionRepository) transactionRepository: TransactionRepository;
  @inject('Logger') logger: Logger;

  router: express.Application;

  constructor(@inject(GameAuthenticationMiddleware) authMiddleware: GameAuthenticationMiddleware) {
    this.router = express().use(authMiddleware.apply).post('/increment', this.increment);
  }

  increment = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { userId, collectionId, balances } = request.body.data;

    try {
      const createdUserResource = await this.userResourceIncrementor.apply(
        collectionId,
        userId,
        response.locals.game.id,
        balances
      );

      response.status(200).send({ data: createdUserResource });
    } catch (e: any) {
      const BAD_REQUEST_ERRORS = ['ResourceNotFound', 'GameNotFound'];

      if (BAD_REQUEST_ERRORS.includes(e.name))
        return next(new HTTPBadRequestError([{ title: e.name, detail: e.message }]));

      throw e;
    }
  };
}

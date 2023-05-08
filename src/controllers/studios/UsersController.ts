import { injectable, inject } from 'inversify';
import express, { NextFunction, Request, Response } from 'express';

import { GameAuthenticationMiddleware } from '../../middlewares/GameAuthenticationMiddleware';
import { AccountVerifier } from '../../services/playfab/AccountVerifier';
import { UserRepository } from '../../repositories/UserRepository';
import { UserFactory } from '../../services/factories/UserFactory';
import { HTTPBadRequestError } from '../../errors/http';

@injectable()
export class UsersController {
  @inject(UserRepository)
  private userRepository: UserRepository;

  @inject(UserFactory)
  private userFactory: UserFactory;

  @inject(AccountVerifier)
  private accountVerifier: AccountVerifier;

  router = express.Router();

  constructor(@inject(GameAuthenticationMiddleware) authMiddleware: GameAuthenticationMiddleware) {
    this.router.use(authMiddleware.apply).post('/', this.create).get('/', this.find);
  }

  private find = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userRepository.findByAccountId(request.query.accountId.toString());

      response.status(200).send({
        data: user,
      });
    } catch (e) {
      this.errorHandler(e, next);
    }
  };

  private create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = request.body.data;

      await this.accountVerifier.isValid(accountId);

      const user = await this.userFactory.call(accountId, response.locals.game.key);
      const createdUser = await this.userRepository.create(user);

      response.status(201).send({ data: createdUser });
    } catch (e) {
      this.errorHandler(e, next);
    }
  };

  private errorHandler(e: any, next: NextFunction) {
    const BAD_REQUEST = ['InvalidParams'];

    if (BAD_REQUEST.includes(e.name)) return next(new HTTPBadRequestError([{ title: e.name, detail: e.message }]));

    next(e);
  }
}

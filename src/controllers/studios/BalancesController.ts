import { injectable, inject } from 'inversify';
import express, { Request, Response } from 'express';

import { GameAuthenticationMiddleware } from '../../middlewares/GameAuthenticationMiddleware';
import { BalanceDecrementor } from '../../services/balance/BalanceDecrementor';
import { BalanceIncrementor } from '../../services/balance/BalanceIncrementor';
import { Game } from '../../types';

@injectable()
export class UsersBalancesController {
  @inject(BalanceDecrementor) private balanceDecrementor: BalanceDecrementor;
  @inject(BalanceIncrementor) private balanceIncrementor: BalanceIncrementor;

  router: express.Application;

  constructor(@inject(GameAuthenticationMiddleware) authMiddleware: GameAuthenticationMiddleware) {
    this.router = express()
      .use(authMiddleware.apply)
      .patch('/increment', this.increment)
      .patch('/decrement', this.decrement);
  }

  increment = async (request: Request, response: Response): Promise<void> => {
    try {
      const { accountId, key, value } = request.body.data;

      if (!this.isTokenValidForGame(key, response.locals.game)) {
        return this.sendInvalidTokenError(request, response);
      }

      const user = await this.balanceIncrementor.apply(accountId, key, value);

      response.send({ data: { userId: user.id, accountId: user.accountId, balances: user.balances } });
    } catch (err: any) {
      response.status(400).send({ error: { detail: err.message } });
    }
  };

  decrement = async (request: Request, response: Response): Promise<void> => {
    try {
      const { accountId, key, value } = request.body.data;

      if (!this.isTokenValidForGame(key, response.locals.game)) {
        return this.sendInvalidTokenError(request, response);
      }

      const user = await this.balanceDecrementor.apply(accountId, key, value);

      response.send({ data: { userId: user._id, accountId: user.accountId, balances: user.balances } });
    } catch (err: any) {
      response.status(400).send({ error: { detail: err.message } });
    }
  };

  private sendInvalidTokenError(request: Request, response: Response): void {
    response.status(400).send({ error: { detail: 'Invalid token symbol' } });
  }

  private isTokenValidForGame(key: string, game: Game): boolean {
    const validTokens = Object.keys(game.currencies);

    return validTokens.includes(key);
  }
}

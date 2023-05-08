import createError from 'http-errors';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';

import { GameRepository } from '../repositories/GameRepository';
import { NotFoundError, UnauthorizedError } from '../errors/application';

@injectable()
export class GameAuthenticationMiddleware {
  @inject(GameRepository) gameRepository: GameRepository;

  apply = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    if (!request.headers.authorization) {
      throw new UnauthorizedError('Authorization Error');
    }

    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.replace('Bearer ', '');

    try {
      const game = await this.gameRepository.findByKey(token);
      response.locals.game = game;

      next();
    } catch (err: any) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      throw new createError.Unauthorized('Invalid game token');
    }
  };
}

import { injectable, inject } from 'inversify';
import express, { Request, Response } from 'express';

import { GenericAuthenticationMiddleware } from '../../middlewares/GenericAuthenticationMiddleware';
import { GameFactory } from '../../services/factories/GameFactory';
import { GameRepository } from '../../repositories/GameRepository';

@injectable()
export class GamesController {
  @inject(GameRepository) private gameRepository: GameRepository;
  @inject(GameFactory) private gameFactory: GameFactory;

  router: express.Application;

  constructor(@inject(GenericAuthenticationMiddleware) authMiddleware: GenericAuthenticationMiddleware) {
    this.router = express().use(authMiddleware.apply).post('/', this.create);
  }

  create = async (request: Request, response: Response) => {
    try {
      const { name, studioId, chain, contractAddress, currencies } = request.body.data;

      const game = this.gameFactory.call(name, studioId, chain, contractAddress, currencies);
      const storedGame = await this.gameRepository.create(game);

      response.status(201).send({ data: storedGame });
    } catch (err) {
      this.handleError(err, response);
    }
  };

  private handleError(err: any, response: Response) {
    if (err.message == 'Studio not found') return response.status(400).send({ error: { details: err.message } });

    if (err.message == 'Invalid or incomplete Game Info')
      return response.status(400).send({ error: { details: err.message } });

    return response.sendStatus(500);
  }
}

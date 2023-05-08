import { injectable } from 'inversify';

import GameModel, { GameDocument } from '../models/Game';
import { NotFoundError } from '../errors/application';
import StudioModel from '../models/Studio';
import { Game } from '../types';

@injectable()
export class GameRepository {
  async create(game: Game): Promise<Game> {
    const studio = await StudioModel.findById(game.studioId);

    if (!studio) throw new NotFoundError('Studio not found');

    const gameDocument = new GameModel({
      name: game.name,
      studioId: studio.id,
      chain: game.chain,
      contractAddress: game.contractAddress,
      currencies: game.currencies,
    });

    const savedGame = await gameDocument.save();

    return this.toGameObject(savedGame);
  }

  async findAll(): Promise<Game[]> {
    const games = await GameModel.find();

    if (!games.length) return [];

    return games.map(this.toGameObject);
  }

  async findById(gameId: string): Promise<Game> {
    const game = await GameModel.findById(gameId);

    if (!game) throw new NotFoundError('Game not found');

    return this.toGameObject(game);
  }

  async findByKey(gameKey: string): Promise<Game> {
    const game = await GameModel.findOne({ key: gameKey });

    if (!game) throw new NotFoundError('Game not found');

    return this.toGameObject(game);
  }

  async findByContractAddress(contractAddress: string): Promise<Game> {
    const game = await GameModel.findOne({ contractAddress });

    if (!game) throw new NotFoundError('Game not found');

    return this.toGameObject(game);
  }

  private toGameObject(game: GameDocument): Game {
    return {
      id: game.id,
      name: game.name,
      key: game.key,
      contractAddress: game.contractAddress,
      studioId: game.studioId.toString(),
      chain: game.chain,
      currencies: game.currencies,
    };
  }
}

import { inject, injectable } from 'inversify';

import CollectionModel, { CollectionDocument } from '../models/Collection';
import { GameRepository } from '../repositories/GameRepository';
import { Logger } from '../types/ILogger';
import { Collection } from '../types';

@injectable()
export class CollectionStorer {
  @inject(GameRepository) gameRepository: GameRepository;
  @inject('Logger') logger!: Logger;

  apply = async (collection: Collection): Promise<Collection> => {
    try {
      const createdCollection = await CollectionModel.create(collection);

      return this.toCollectionObject(createdCollection);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  };

  private toCollectionObject(collection: CollectionDocument): Collection {
    return {
      id: collection.id,
      gameId: collection.gameId.toString(),
      contractAddress: collection.contractAddress,
      name: collection.name,
      type: collection.type,
    };
  }
}

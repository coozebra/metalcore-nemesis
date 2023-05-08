import { injectable, inject } from 'inversify';

import { CollectionRepository } from '../repositories/CollectionRepository';
import { UnauthorizedError } from '../errors/application';

import { Game } from '../types';

@injectable()
export class CollectionOwnershipVerifier {
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;

  async apply(collectionId: string, game: Game): Promise<void> {
    const collections = await this.collectionRepository.findManyByGameId(game.id);

    const includes = collections.map((coll) => coll.id).includes(collectionId);

    if (!collections || !includes) throw new UnauthorizedError('Collection ownership refused');

    return;
  }
}

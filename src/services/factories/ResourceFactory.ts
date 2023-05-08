import { inject, injectable } from 'inversify';

import { Game, Resource } from '../../types';
import { CollectionOwnershipVerifier } from '../CollectionOwnershipVerifier';

@injectable()
export class ResourceFactory {
  @inject(CollectionOwnershipVerifier) collectionOwnershipVerifier: CollectionOwnershipVerifier;

  async call(collectionId: string, attributes: Record<string, unknown>, game: Game): Promise<Resource> {
    await this.collectionOwnershipVerifier.apply(collectionId, game);

    return {
      collectionId,
      attributes,
    };
  }
}

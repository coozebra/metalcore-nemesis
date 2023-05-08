import { inject, injectable } from 'inversify';

import { TransactionType, TransactionState, Transaction, ResourceTxMetadata, Balances } from '../../types';
import { CollectionRepository } from '../../repositories/CollectionRepository';
import { ResourceRepository } from '../../repositories/ResourceRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { UnauthorizedError } from '../../errors/application';
import { Logger } from '../../types/ILogger';

type ResourceTx = Transaction<ResourceTxMetadata>;

@injectable()
export class ResourceTxFactory {
  @inject('Logger') logger!: Logger;
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(ResourceRepository) private resourceRepository: ResourceRepository;

  async call(collectionId: string, userId: string, gameId: string, balances: Balances): Promise<ResourceTx> {
    const [user, collection] = await Promise.all([
      this.userRepository.findById(userId),
      this.collectionRepository.findById(collectionId),
    ]);

    if (collection.gameId !== gameId) throw new UnauthorizedError('Collection ownership refused');

    await Promise.all(
      Object.entries(balances).map(([resourceId]) => this.resourceRepository.findByResourceId(resourceId))
    );

    return {
      state: TransactionState.pending,
      type: TransactionType.MintResource,
      groupId: collection.id,
      metadata: {
        userId: user.id,
        collectionId: collection.id,
        gameId: gameId,
        balances: balances,
      },
    };
  }
}

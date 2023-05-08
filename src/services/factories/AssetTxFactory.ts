import { inject, injectable } from 'inversify';

import { TransactionType, TransactionState, Transaction, AssetTxMetadata } from '../../types';
import { CollectionRepository } from '../../repositories/CollectionRepository';
import { UnauthorizedError } from '../../errors/application';
import { Logger } from '../../types/ILogger';

type AssetTx = Transaction<AssetTxMetadata>;

@injectable()
export class AssetTxFactory {
  @inject('Logger') logger!: Logger;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;

  async call(
    collectionId: string,
    userId: string,
    gameId: string,
    transactionType: TransactionType,
    tokenId?: number,
    amount = 1
  ): Promise<AssetTx> {
    const collection = await this.collectionRepository.findById(collectionId);

    if (collection.gameId !== gameId) throw new UnauthorizedError('Collection ownership refused');

    return {
      state: TransactionState.pending,
      type: transactionType,
      groupId: collection.id,
      metadata: {
        userId,
        collectionId: collection.id,
        tokenId,
        amount,
      },
    };
  }
}

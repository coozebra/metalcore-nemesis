import { inject, injectable } from 'inversify';
import { ClientSession } from 'mongoose';

import { TransactionRepository } from '../../repositories/TransactionRepository';
import { MongoTransaction } from '../../repositories/MongoTransaction';
import { AssetRepository } from '../../repositories/AssetRepository';
import { AssetTxFactory } from '../factories/AssetTxFactory';
import { TransactionType, Asset, AssetStateMap } from '../../types';
import { ConflictError } from '../../errors/application';

@injectable()
export class AssetBurner {
  @inject(AssetRepository) private assetRepository: AssetRepository;
  @inject(TransactionRepository) private transactionRepository: TransactionRepository;
  @inject(AssetTxFactory) private assetTxFactory: AssetTxFactory;
  @inject(MongoTransaction) private mongoTransaction: MongoTransaction;

  apply = async (assetId: string, gameId: string): Promise<Asset> => {
    const asset = await this.assetRepository.findById(assetId);

    if (!asset.tokenId) throw new ConflictError('Cannot burn the unminted asset');

    const transaction = await this.assetTxFactory.call(
      asset.collectionId,
      asset.userId,
      gameId,
      TransactionType.BurnAsset,
      asset.tokenId
    );

    await this.mongoTransaction.runInTransaction((session: ClientSession) =>
      Promise.all([
        this.assetRepository.updateState(assetId, AssetStateMap.burning, session),
        this.transactionRepository.create(transaction, session),
      ])
    );

    return this.assetRepository.findById(asset.id);
  };
}

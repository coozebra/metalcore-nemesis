import { inject, injectable } from 'inversify';
import { ClientSession } from 'mongoose';

import { TransactionRepository } from '../../repositories/TransactionRepository';
import { MongoTransaction } from '../../repositories/MongoTransaction';
import { AssetRepository } from '../../repositories/AssetRepository';
import { CreateAssetDTO } from '../../dto/assets/CreateAssetDTO';
import { AssetTxFactory } from '../factories/AssetTxFactory';
import { AssetFactory } from '../factories/AssetFactory';
import { Asset, AssetStateMap, TransactionType } from '../../types';

@injectable()
export class AssetCreator {
  @inject(AssetFactory) private assetFactory: AssetFactory;
  @inject(AssetTxFactory) private assetTxFactory: AssetTxFactory;
  @inject(AssetRepository) private assetRepository: AssetRepository;
  @inject(MongoTransaction) private mongoTransaction: MongoTransaction;
  @inject(TransactionRepository) private transactionRepository: TransactionRepository;

  async apply(dto: CreateAssetDTO): Promise<Asset> {
    const asset = await this.assetFactory.call({
      ...dto,
      state: AssetStateMap.minting,
    });

    const transaction = await this.assetTxFactory.call(
      dto.collectionId,
      asset.userId,
      dto.game.id,
      TransactionType.MintAsset
    );

    await this.mongoTransaction.runInTransaction((session: ClientSession) =>
      Promise.all([this.assetRepository.create(asset), this.transactionRepository.create(transaction, session)])
    );

    return asset;
  }
}

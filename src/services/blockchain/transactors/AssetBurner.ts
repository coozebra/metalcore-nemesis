import { inject, injectable } from 'inversify';

import { GamePortalContractFactory } from '../../factories/GamePortalContractFactory';
import { CollectionRepository } from '../../../repositories/CollectionRepository';
import { Transaction, AssetTxMetadata } from '../../../types/';
import { BaseTransactor } from './BaseTransactor';

@injectable()
export class AssetBurner implements BaseTransactor {
  @inject(CollectionRepository) private collectionRepository!: CollectionRepository;
  @inject(GamePortalContractFactory) private gamePortalContractFactory: GamePortalContractFactory;

  async apply(transactions: Transaction<AssetTxMetadata>[]): Promise<string> {
    const { collectionId } = transactions[0].metadata;
    const tokenIds = transactions.map((transaction) => transaction.metadata.tokenId);

    const { contractAddress, gameId } = await this.collectionRepository.findById(collectionId);

    const contract = await this.gamePortalContractFactory.call(gameId);

    await contract.callStatic.burnBatchAsset(contractAddress, tokenIds);
    const { hash } = await contract.burnBatchAsset(contractAddress, tokenIds);

    return hash;
  }
}

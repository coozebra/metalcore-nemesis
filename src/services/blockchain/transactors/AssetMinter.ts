import { inject, injectable } from 'inversify';

import { Logger } from '../../../types/ILogger';
import { BaseTransactor } from './BaseTransactor';
import { Transaction, AssetTxMetadata } from '../../../types';
import { CollectionRepository } from '../../../repositories/CollectionRepository';
import { GamePortalContractFactory } from '../../factories/GamePortalContractFactory';

@injectable()
export class AssetMinter implements BaseTransactor {
  @inject('Logger') private logger!: Logger;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(GamePortalContractFactory) private gamePortalContractFactory: GamePortalContractFactory;

  async apply(transactions: Transaction<AssetTxMetadata>[]): Promise<string> {
    const { collectionId } = transactions[0].metadata;

    const { contractAddress, gameId } = await this.collectionRepository.findById(collectionId);

    const gamePortalContract = await this.gamePortalContractFactory.call(gameId);
    const gamePortalAddress = gamePortalContract.address;

    const network = await gamePortalContract.provider.getNetwork();

    const amount = this.sumAmounts(transactions);

    await gamePortalContract.callStatic.mintBatchAsset(contractAddress, gamePortalAddress, amount);

    this.logger.info(
      `[AssetMinter] Minting ${amount} assets to Contract ${contractAddress} via ` +
        `Portal ${gamePortalContract.address} at Chain ID ${network.chainId}`
    );

    const { hash } = await gamePortalContract.mintBatchAsset(contractAddress, gamePortalAddress, amount);

    return hash;
  }

  private sumAmounts(transactions: Transaction<AssetTxMetadata>[]): number {
    return transactions.map(({ metadata: { amount } }) => amount).reduce((acc, amount) => acc + amount, 0);
  }
}

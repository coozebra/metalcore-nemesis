import { inject, injectable } from 'inversify';
import { Contract, Wallet } from 'ethers';

import { Logger } from '../../../types/ILogger';
import settings from '../../../config/settings';
import { BaseTransactor } from './BaseTransactor';
import GamePortal from '../../../abi/GamePortal.json';
import { Transaction, ResourceTxMetadata } from '../../../types';
import { GameRepository } from '../../../repositories/GameRepository';
import { BlockchainProviderFactory } from '../../BlockchainProviderFactory';
import { CollectionRepository } from '../../../repositories/CollectionRepository';

@injectable()
export class UserResourceMinter implements BaseTransactor {
  @inject('Logger') logger!: Logger;
  @inject(CollectionRepository) collectionRepository!: CollectionRepository;
  @inject(GameRepository) gameRepository!: GameRepository;
  @inject(BlockchainProviderFactory) blockchainProviderFactory!: BlockchainProviderFactory;

  async apply(transactions: Transaction<ResourceTxMetadata>[]): Promise<string> {
    const { collectionId } = transactions[0].metadata;

    const { contractAddress, gameId } = await this.collectionRepository.findById(collectionId);

    const { contractAddress: gamePortal } = await this.gameRepository.findById(gameId);

    const provider = this.blockchainProviderFactory.apply(settings.blockchain.polygon.provider);
    const wallet = new Wallet(settings.blockchain.polygon.gamePortalKey, provider);

    const contract = new Contract(gamePortal, GamePortal.abi, wallet);

    const tokenIds = transactions.map(({ metadata: { tokenId } }) => tokenId);
    const amounts = transactions.map(({ metadata: { tokenId } }) => tokenId);

    await contract.callStatic.mintBatchResource(contractAddress, wallet.address, tokenIds, amounts);

    const { txHash } = await contract.mintBatchResource(contractAddress, wallet.address, tokenIds, amounts);

    return txHash;
  }
}

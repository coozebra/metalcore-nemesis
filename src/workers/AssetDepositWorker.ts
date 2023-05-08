import { inject, injectable } from 'inversify';
import { Event } from 'ethers';

import { UserAssetDepositAssigner } from '../services/userAsset/UserAssetDepositAssigner';
import { CollectionRepository } from '../repositories/CollectionRepository';
import { GameRepository } from '../repositories/GameRepository';
import { GamePortalContractFactory } from '../services/factories/GamePortalContractFactory';
import ContractScanWorker from './ContractScanWorker';

@injectable()
class AssetDepositWorker extends ContractScanWorker {
  @inject(UserAssetDepositAssigner) private userAssetDepositAssigner: UserAssetDepositAssigner;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(GameRepository) private gameRepository: GameRepository;
  @inject(GamePortalContractFactory) private gamePortalContractFactory: GamePortalContractFactory;

  async processTransactions(contractAddress: string, fromBlock: number, toBlock: number): Promise<void> {
    this.logger.info(`[AssetDepositWorker] Scanning from ${fromBlock} to ${toBlock} block at ${contractAddress}`);

    const game = await this.gameRepository.findByContractAddress(contractAddress);

    const contract = await this.gamePortalContractFactory.call(game.id);

    const events = await contract.queryFilter(contract.filters.LogERC721Deposited(), fromBlock, toBlock);

    this.logger.info(`[AssetDepositWorker] Found ${events.length} events`);

    await Promise.all(
      events.map((event) => {
        const { collectionContractAddress, tokenId, walletAddress } = this.parseEventArgs(event);

        return this.userAssetDepositAssigner.apply(collectionContractAddress, tokenId, walletAddress);
      })
    );
  }

  private parseEventArgs(event: Event) {
    return {
      collectionContractAddress: event.args[0],
      tokenId: event.args[1].toNumber(),
      walletAddress: event.args[2],
    };
  }
}

export default AssetDepositWorker;

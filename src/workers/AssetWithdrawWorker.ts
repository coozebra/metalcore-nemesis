import { inject, injectable } from 'inversify';
import { Event } from 'ethers';

import { UserAssetWithdrawAssigner } from '../services/userAsset/UserAssetWithdrawAssigner';
import { GameRepository } from '../repositories/GameRepository';
import { GamePortalContractFactory } from '../services/factories/GamePortalContractFactory';
import ContractScanWorker from './ContractScanWorker';

@injectable()
class AssetWithdrawWorker extends ContractScanWorker {
  @inject(UserAssetWithdrawAssigner) private userAssetWithdrawAssigner: UserAssetWithdrawAssigner;
  @inject(GameRepository) private gameRepository: GameRepository;
  @inject(GamePortalContractFactory) private gamePortalContractFactory: GamePortalContractFactory;

  async processTransactions(contractAddress: string, fromBlock: number, toBlock: number): Promise<void> {
    this.logger.info(`[AssetWithdrawWorker] Scanning from ${fromBlock} to ${toBlock} block at ${contractAddress}`);

    const game = await this.gameRepository.findByContractAddress(contractAddress);

    const contract = await this.gamePortalContractFactory.call(game.id);

    const events = await contract.queryFilter(contract.filters.LogERC721Withdrawn(), fromBlock, toBlock);

    this.logger.info(`[AssetWithdrawWorker] Found ${events.length} events`);

    await Promise.all(
      events.map((event) => {
        const { collectionContractAddress, tokenId } = this.parseEventArgs(event);

        return this.userAssetWithdrawAssigner.apply(collectionContractAddress, tokenId);
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

export default AssetWithdrawWorker;

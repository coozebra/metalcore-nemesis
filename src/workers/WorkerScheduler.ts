import { inject, injectable } from 'inversify';

import { ContractScanStatusRepository } from '../repositories/ContractScanStatusRepository';
import { BlockchainProviderFactory } from '../services/BlockchainProviderFactory';
import { CollectionRepository } from '../repositories/CollectionRepository';
import { GameRepository } from '../repositories/GameRepository';
import { AssetDepositWorker, ResourceDepositWorker, TransactionWorker } from '.';
import { ContractScanType } from '../types';
import Settings from '../types/Settings';
import { Logger } from '../types/ILogger';
import AssetWithdrawWorker from './AssetWithdrawWorker';

@injectable()
export class WorkerScheduler {
  @inject('Settings') private settings: Settings;
  @inject('Logger') private logger: Logger;

  @inject(BlockchainProviderFactory) blockchainProviderFactory: BlockchainProviderFactory;

  @inject(GameRepository) gameRepository: GameRepository;
  @inject(CollectionRepository) collectionRepository: CollectionRepository;
  @inject(ContractScanStatusRepository) contractScanStatusRepository: ContractScanStatusRepository;

  @inject(TransactionWorker) transactionWorker: TransactionWorker;
  @inject(AssetDepositWorker) assetDepositWorker: AssetDepositWorker;
  @inject(AssetWithdrawWorker) assetWithdrawWorker: AssetWithdrawWorker;
  @inject(ResourceDepositWorker) resourceDepositWorker: ResourceDepositWorker;

  start() {
    setInterval(async () => {
      await this.checkPortals().catch(console.error);
      this.logger.info('[WorkerScheduler] Scheduling Portal Scan Workers');
    }, this.settings.jobs.contractScanWorker.interval).unref();

    setInterval(async () => {
      await this.transactionWorker.enqueue({});
      this.logger.info('[WorkerScheduler] Scheduling TransactionWorker');
    }, this.settings.jobs.transactionWorker.interval).unref();
  }

  async checkPortals() {
    // TODO: Not every game is on the same chain
    const games = (await this.gameRepository.findAll()).filter((game) => game.contractAddress);

    const { provider, blockNumber, contractScanStatuses } = await this.getContractScanStatuses();

    const contractScanStatusMap = Object.fromEntries(
      contractScanStatuses.map((scanStatus) => [`${scanStatus.contractAddress}${scanStatus.scanType}`, scanStatus])
    );

    for (const { contractAddress } of games) {
      // enqueue withdraw jobs
      const withdrawKey = `${contractAddress}${ContractScanType.WithdrawAsset}`;

      if (!contractScanStatusMap[withdrawKey]) {
        contractScanStatusMap[withdrawKey] = await this.contractScanStatusRepository.create({
          chainId: provider.network.chainId,
          scanType: ContractScanType.WithdrawAsset,
          contractAddress,
          firstBlock: blockNumber,
          lastBlock: blockNumber - 1,
        });
      }

      await this.assetWithdrawWorker.enqueue({ contractScanStatusId: contractScanStatusMap[withdrawKey].id });

      // enqueue deposit jobs
      const depositKey = `${contractAddress}${ContractScanType.DepositAsset}`;

      if (!contractScanStatusMap[depositKey]) {
        contractScanStatusMap[depositKey] = await this.contractScanStatusRepository.create({
          chainId: provider.network.chainId,
          scanType: ContractScanType.DepositAsset,
          contractAddress,
          firstBlock: blockNumber,
          lastBlock: blockNumber - 1,
        });
      }

      await this.assetDepositWorker.enqueue({ contractScanStatusId: contractScanStatusMap[depositKey].id });
    }
  }

  /**
   * Create scanStatus object that doesn't exist and enqueue all tasks
   */
  async checkCollections() {
    // TODO: Not every collection is on Polygon
    const collections = await this.collectionRepository.findAll();

    const { provider, blockNumber, contractScanStatuses } = await this.getContractScanStatuses();

    const contractScanStatusMap = Object.fromEntries(
      contractScanStatuses.map((scanStatus) => [`${scanStatus.contractAddress}${scanStatus.scanType}`, scanStatus])
    );

    for (const { type, contractAddress } of collections) {
      if (type === 'ERC-721') {
        const key = `${contractAddress}${ContractScanType.MintAsset}`;

        if (!contractScanStatusMap[key]) {
          contractScanStatusMap[key] = await this.contractScanStatusRepository.create({
            chainId: provider.network.chainId,
            scanType: ContractScanType.MintAsset,
            contractAddress,
            firstBlock: blockNumber,
            lastBlock: blockNumber - 1,
          });
        }
      } else if (type === 'ERC-1155') {
        const key = `${contractAddress}${ContractScanType.DepositUserResource}`;

        if (!contractScanStatusMap[key]) {
          contractScanStatusMap[key] = await this.contractScanStatusRepository.create({
            chainId: provider.network.chainId,
            scanType: ContractScanType.DepositUserResource,
            contractAddress,
            firstBlock: blockNumber,
            lastBlock: blockNumber - 1,
          });
        }

        await this.resourceDepositWorker.enqueue({ contractScanStatusId: contractScanStatusMap[key].id });
      }
    }
  }

  private async getContractScanStatuses() {
    const provider = this.blockchainProviderFactory.apply(this.settings.blockchain.polygon.provider);

    const blockNumber = await provider.getBlockNumber();

    const contractScanStatuses = await this.contractScanStatusRepository.findAll();

    return { provider, blockNumber, contractScanStatuses };
  }
}

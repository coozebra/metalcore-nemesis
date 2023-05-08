import Bull from 'bullmq';
import { inject, injectable } from 'inversify';

import { ContractScanStatusRepository } from '../repositories/ContractScanStatusRepository';
import { BlockchainProviderFactory } from '../services/BlockchainProviderFactory';
import { Logger } from '../types/ILogger';
import settings from '../config/settings';
import BasicWorker from './BasicWorker';

@injectable()
abstract class ContractScanWorker extends BasicWorker {
  @inject('Logger') logger!: Logger;

  @inject(ContractScanStatusRepository) contractScanStatusRepository!: ContractScanStatusRepository;
  @inject(BlockchainProviderFactory) blockchainProviderFactory!: BlockchainProviderFactory;

  readonly numConfirmations = settings.blockchain.polygon.confirmations;
  readonly scanBatchSize = settings.blockchain.polygon.scanBatchSize;
  readonly providerUrl = settings.blockchain.polygon.provider;

  apply = async (job: Bull.Job): Promise<void> => {
    const { contractScanStatusId } = job.data;

    const { lastBlock, contractAddress } = await this.contractScanStatusRepository.findById(contractScanStatusId);

    const fromBlock = lastBlock + 1;

    const provider = this.blockchainProviderFactory.apply(this.providerUrl);

    const blockNumber = await provider.getBlockNumber();

    const maxBlock = blockNumber - this.numConfirmations;

    const toBlock = Math.min(fromBlock + (this.scanBatchSize - 1), maxBlock);

    if (fromBlock > toBlock) {
      return;
    }

    await this.processTransactions(contractAddress, fromBlock, toBlock);

    await this.contractScanStatusRepository.updateLastBlock(contractScanStatusId, toBlock);
  };

  abstract processTransactions(contractAddress: string, fromBlock: number, toBlock: number): Promise<void>;
}

export default ContractScanWorker;

import Bull from 'bullmq';
import lodash from 'lodash';
import { inject, injectable, postConstruct } from 'inversify';
import { TransactionReceipt } from '@ethersproject/abstract-provider';

import Settings from '../types/Settings';
import { SingletonWorker } from './SingletonWorker';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionState, TransactionType, UnknownTransaction } from '../types';
import { BlockchainProviderFactory } from '../services/BlockchainProviderFactory';

import { AssetMinter, AssetBurner, UserResourceMinter, BaseTransactor } from '../services/blockchain/transactors';

import { AssetReceiptProcessor, BaseReceiptProcessor } from '../services/blockchain/receiptProcessors';
import { MetricsReporter } from '../metrics/MetricsReporter';

@injectable()
class TransactionWorker extends SingletonWorker {
  @inject('Settings') private settings!: Settings;
  @inject(MetricsReporter) private metricsReporter: MetricsReporter;
  @inject(TransactionRepository) private transactionRepository!: TransactionRepository;
  @inject(BlockchainProviderFactory) private blockchainProviderFactory!: BlockchainProviderFactory;

  @inject(AssetMinter) private assetMinter: AssetMinter;
  @inject(UserResourceMinter) private userResourceMinter!: UserResourceMinter;
  @inject(AssetBurner) assetBurner!: AssetBurner;

  @inject(AssetReceiptProcessor) private assetReceiptProcessor: AssetReceiptProcessor;

  readonly transactors: Record<string, BaseTransactor> = {};
  readonly receiptProcessors: Record<string, BaseReceiptProcessor> = {};

  @postConstruct()
  public initialize() {
    this.transactors[TransactionType.MintResource] = this.userResourceMinter;
    this.transactors[TransactionType.MintAsset] = this.assetMinter;
    this.transactors[TransactionType.BurnAsset] = this.assetBurner;

    this.receiptProcessors[TransactionType.MintAsset] = this.assetReceiptProcessor;
    this.receiptProcessors[TransactionType.BurnAsset] = this.assetReceiptProcessor;
  }

  apply = async (job: Bull.Job): Promise<void> => {
    const interval = this.settings.jobs.transactionWorker.interval;
    const lockTTL = this.settings.jobs.transactionWorker.lockTTL;

    if (this.isStale(job, interval)) return;

    await this.synchronizeWork('transaction-worker', lockTTL, this.applySync);
  };

  applySync = async (): Promise<void> => {
    const transactions = await this.transactionRepository.findAllExceptState(TransactionState.submitted);

    this.logger.info(`[TransactionWorker] Initializing. Found ${transactions.length} transactions to process`);

    const submittingTransactions = transactions.filter(({ state }) => state === TransactionState.submitting);
    const pendingTransactions = transactions.filter(({ state }) => state === TransactionState.pending);

    this.logger.info(
      `[TransactionWorker] Submitting: ${submittingTransactions.length} | Pending: ${pendingTransactions.length}`
    );

    if (submittingTransactions.length) {
      // TODO: Not every transaction will be on Polygon
      const { provider: providerUrl, confirmations: numConfirmations } = this.settings.blockchain.polygon;
      const provider = this.blockchainProviderFactory.apply(providerUrl);

      const currentBlockNumber = await provider.getBlockNumber();

      const rejectedTxs: UnknownTransaction[] = [];
      const confirmedTxs: Record<string, UnknownTransaction[]> = {};
      const receipts: Record<string, TransactionReceipt> = {};

      let hasUnconfirmed = false;

      const submittingTxsGroupedByHash = lodash.groupBy(submittingTransactions, (tx) => tx.transactionHash);

      await Promise.all(
        Object.keys(submittingTxsGroupedByHash).map(async (txHash) => {
          const receipt = await provider.getTransactionReceipt(txHash);

          if (!receipt) {
            return (hasUnconfirmed = true);
          }

          receipts[txHash] = receipt;

          const { blockNumber, status } = receipt;

          const transactions = submittingTxsGroupedByHash[txHash];

          if (!status) {
            rejectedTxs.push(...transactions);
          } else if (currentBlockNumber - blockNumber >= numConfirmations) {
            confirmedTxs[txHash] = transactions;
          }
        })
      );

      if (hasUnconfirmed) {
        // should wait until all TXs are confirmed to avoid nonce race condition.
        return;
      }

      if (Object.keys(confirmedTxs).length) {
        this.logger.info(`[TransactionWorker] Confirmed transactions: ${Object.keys(confirmedTxs).length}`);
        await Promise.all(
          Object.keys(confirmedTxs).map((txHash) => {
            return this.processReceipt(confirmedTxs[txHash], receipts[txHash]);
          })
        );
      }

      if (rejectedTxs.length) {
        pendingTransactions.push(...rejectedTxs);
      }
    }

    return this.transact(pendingTransactions);
  };

  private processReceipt = async (transactions: UnknownTransaction[], receipt: TransactionReceipt): Promise<void> => {
    this.metricsReporter.apply(transactions[0].type, {
      gasUsed: receipt.gasUsed.toNumber(),
      effectiveGasPrice: receipt.effectiveGasPrice.toNumber(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toNumber(),
    });

    const processor = this.receiptProcessors[transactions[0].type];

    if (!processor) {
      this.logger.warn(`No Receipt Processor for Transaction type [${transactions[0].type}].`);
      await this.markSubmitted(transactions);

      return;
    }

    try {
      // process first. if it fails, do not mark Transaction as submitted.
      await processor.apply(transactions, receipt);

      await this.markSubmitted(transactions);
    } catch (err) {
      this.logger.error('[TransactionWorker] Receipt processing failed', err);
    }
  };

  private transact = async (transactions: UnknownTransaction[]): Promise<void> => {
    const groupedTransactions = lodash.groupBy(transactions, ({ type, groupId }) => `${type}:${groupId}`);

    await Promise.all(
      Object.values(groupedTransactions).map(async (transactions) => {
        const transactor = this.transactors[transactions[0].type];

        if (!transactor) {
          this.logger.warn(`[TransactionWorker] Transaction [${transactions[0].type}] is not supported.`);
          return;
        }

        try {
          const transactionHash = await transactor.apply(transactions);

          // update the state
          await this.transactionRepository.updateTransactionStateAndHash(
            transactions.map(({ id }) => id),
            TransactionState.submitting,
            transactionHash
          );
        } catch (err) {
          this.logger.error('[TransactionWorker] Transaction failed', err);
        }
      })
    );
  };

  private async markSubmitted(transactions: UnknownTransaction[]): Promise<void> {
    this.logger.info(`[TransactionWorker] Marking ${transactions.length} transactions as submitted`);

    await this.transactionRepository.updateTransactionState(
      transactions.map(({ id }) => id),
      TransactionState.submitted
    );
  }
}

export default TransactionWorker;

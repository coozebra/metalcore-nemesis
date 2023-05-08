import { ethers } from 'ethers';
import { inject, injectable } from 'inversify';
import { LogDescription } from 'ethers/lib/utils';
import { TransactionReceipt } from '@ethersproject/abstract-provider';

import Asset from '../../../abi/Asset.json';
import { AssetAssigner } from '../../assets/AssetAssigner';
import { BaseReceiptProcessor } from './BaseReceiptProcessor';
import { Transaction, AssetTxMetadata } from '../../../types';
import { AssetBurntStateSetter } from '../../assets/AssetBurntStateSetter';

type Attribution = {
  userId: string;
  collectionId: string;
  tokenId: number;
};

@injectable()
export class AssetReceiptProcessor implements BaseReceiptProcessor {
  @inject(AssetAssigner) private assetAssigner: AssetAssigner;
  @inject(AssetBurntStateSetter) private assetBurntStateSetter: AssetBurntStateSetter;

  async apply(transactions: Transaction<AssetTxMetadata>[], receipt: TransactionReceipt): Promise<void> {
    const [mintLogs, burnLogs] = this.extractLogs(receipt);

    if (mintLogs.length > 0) {
      const attributions = this.makeAttributions(transactions, mintLogs);

      await Promise.all(
        attributions.map((attribution) =>
          this.assetAssigner.apply(attribution.collectionId, attribution.userId, attribution.tokenId)
        )
      );
    }

    if (burnLogs.length > 0) {
      const attributions = this.makeAttributions(transactions, burnLogs);

      await Promise.all(
        attributions.map((attribution) =>
          this.assetBurntStateSetter.apply(attribution.collectionId, attribution.tokenId)
        )
      );
    }
  }

  private extractLogs(receipt: TransactionReceipt): LogDescription[][] {
    const assetInterface = new ethers.utils.Interface(Asset.abi);

    const parsedLogs = receipt.logs.map((log) => assetInterface.parseLog(log));

    const burnt = parsedLogs.filter((log) => log.name === 'LogBurnt');
    const minted = parsedLogs.filter((log) => log.name === 'LogMinted');

    return [minted, burnt];
  }

  private makeAttributions(transactions: Transaction<AssetTxMetadata>[], parsedLogs: LogDescription[]): Attribution[] {
    const tokenIds = this.extractIds(parsedLogs);

    return transactions.map((tx, idx) => {
      return {
        userId: tx.metadata.userId,
        collectionId: tx.metadata.collectionId,
        tokenId: tokenIds[idx],
      };
    });
  }

  private extractIds(logs: LogDescription[]): number[] {
    return logs.map((log) => log.args.tokenId.toNumber());
  }
}

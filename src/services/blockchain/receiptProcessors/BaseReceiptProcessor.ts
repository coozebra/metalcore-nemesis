import { UnknownTransaction } from '../../../types';
import { TransactionReceipt } from '@ethersproject/abstract-provider';

export interface BaseReceiptProcessor {
  apply(transactions: UnknownTransaction[], receipt: TransactionReceipt): Promise<void>;
}

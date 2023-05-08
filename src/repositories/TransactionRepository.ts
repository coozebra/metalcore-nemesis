import { injectable } from 'inversify';
import { ClientSession } from 'mongoose';

import TransactionModel, { TransactionDocument } from '../models/Transaction';
import { TransactionType, Transaction, TransactionState } from '../types';

@injectable()
export class TransactionRepository {
  async create<T extends Record<string, unknown>>(
    transaction: Transaction<T>,
    session?: ClientSession
  ): Promise<Transaction<T>> {
    const [createdTransaction] = await TransactionModel.create([{ ...transaction }], { session: session });

    return this.toTransactionObject<T>(createdTransaction);
  }

  async findAllExceptState(state: string) {
    const result = await TransactionModel.find({ state: { $ne: state } });

    return result.map((tx) => this.toTransactionObject(tx));
  }

  async updateTransactionStateAndHash(ids: string[], state: string, transactionHash: string): Promise<void> {
    await TransactionModel.updateMany({ _id: { $in: ids } }, { state, transactionHash });
  }

  async updateTransactionState(ids: string[], state: string): Promise<void> {
    await TransactionModel.updateMany({ _id: { $in: ids } }, { state });
  }

  private toTransactionObject<T extends Record<string, unknown>>(transaction: TransactionDocument): Transaction<T> {
    return {
      id: transaction.id,
      transactionHash: transaction.transactionHash,
      state: transaction.state as TransactionState,
      updatedAt: transaction.updatedAt,
      type: transaction.type as TransactionType,
      groupId: transaction.groupId,
      metadata: transaction?.metadata as T,
    };
  }
}

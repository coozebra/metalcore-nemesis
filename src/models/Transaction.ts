import mongoose, { Document, Schema } from 'mongoose';
import { TransactionState } from '../types';

export interface TransactionDocument extends Document {
  transactionHash: string;
  state: string;
  type: string;
  groupId: string;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

const TransactionSchema: Schema = new Schema(
  {
    transactionHash: {
      type: String,
      index: true,
      sparse: true,
    },
    state: {
      type: String,
      default: TransactionState.pending,
      required: true,
      index: true,
    },
    type: {
      type: String,
      index: true,
      required: true,
    },
    groupId: {
      // This is used to group transactions for batch minting.
      type: String,
    },
    metadata: Object,
  },
  { timestamps: true }
);

export default mongoose.model<TransactionDocument>('Transaction', TransactionSchema);

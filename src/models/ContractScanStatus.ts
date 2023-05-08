import mongoose, { Document, Schema } from 'mongoose';

export interface ContractScanStatusDocument extends Document {
  contractAddress: string;
  scanType: string;
  firstBlock: number;
  lastBlock: number;
  updatedAt: number;
  chainId: number;
}

const ContractScanStatusSchema: Schema = new Schema(
  {
    contractAddress: {
      type: String,
      required: true,
      minLength: 42,
      maxLength: 42,
    },
    scanType: {
      type: String,
      required: true,
    },
    firstBlock: {
      type: Number,
      required: true,
    },
    lastBlock: {
      type: Number,
      required: true,
    },
    chainId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

ContractScanStatusSchema.index({ chainId: 1, contractAddress: 1, scanType: 1 }, { unique: true });

export default mongoose.model<ContractScanStatusDocument>('ContractScanStatus', ContractScanStatusSchema);

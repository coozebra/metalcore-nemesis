import mongoose, { Schema, Document } from 'mongoose';

export interface UserResourceDocument extends Document {
  collectionId: string;
  userId: string;
  gameId: string;
  balances: { [resourceId: string]: number };
  deposits: {
    txId: string;
    tokenId: string;
    amount: string;
    blockNumber: number;
  }[];
}

const UserResourceSchema: Schema = new Schema({
  collectionId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  gameId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  balances: {
    type: Object,
    of: Number,
  },
  deposits: {
    type: Array,
    of: {
      _id: false,
      txId: {
        type: String,
        unique: true,
        required: true,
      },
      tokenId: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      blockNumber: {
        type: Number,
        required: true,
      },
    },
  },
});

export default mongoose.model<UserResourceDocument>('UserResource', UserResourceSchema);

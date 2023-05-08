import mongoose, { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  accountId: string;
  studioId: string;
  walletAddress?: string;
  balances: Record<string, string>;
}

// wallet address length supposed to be exactly 0x followed by 20 bytes.

const UserSchema: Schema = new Schema({
  accountId: {
    type: String,
    required: true,
    unique: true,
  },
  studioId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    minLength: 42,
    maxLength: 42,
  },
  balances: {
    type: Object,
    of: String,
  },
});

export default mongoose.model<UserDocument>('User', UserSchema);

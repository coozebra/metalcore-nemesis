import mongoose, { Schema, Document } from 'mongoose';
import { randomBytes } from 'crypto';

export interface GameDocument extends Document {
  key: string;
  name: string;
  studioId: string;
  contractAddress: string;
  chain: string;
  currencies: Record<string, string>;
}

const GameSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  studioId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    minLength: 42,
    maxLength: 42,
  },
  key: {
    type: String,
    unique: true,
    default: () => randomBytes(32).toString('hex'),
  },
  chain: String,
  currencies: {
    type: Object,
    of: String,
  },
});

export default mongoose.model<GameDocument>('Game', GameSchema);

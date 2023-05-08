import mongoose, { Schema, Document } from 'mongoose';

export interface CollectionDocument extends Document {
  gameId: string;
  contractAddress: string;
  name: string;
  type: string;
}

const CollectionSchema: Schema = new Schema({
  gameId: {
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
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

export default mongoose.model<CollectionDocument>('Collection', CollectionSchema);

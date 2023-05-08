import mongoose, { Schema, Document } from 'mongoose';

export interface AssetDocument extends Document {
  type: string;
  userId?: string;
  tokenId?: number;
  externalId: string;
  collectionId: string;
  attributes: Record<string, unknown>;
  state?: string;
}

const AssetSchema: Schema = new Schema({
  type: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
  },
  externalId: {
    type: String,
    required: true,
  },
  collectionId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  tokenId: {
    type: Number,
    integer: true,
  },
  state: {
    type: String,
  },
  attributes: {
    type: Object,
    required: true,
  },
});

AssetSchema.index(
  { collectionId: 1, tokenId: 1 },
  { unique: true, partialFilterExpression: { tokenId: { $exists: true } } }
);

export default mongoose.model<AssetDocument>('Asset', AssetSchema);

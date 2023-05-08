import mongoose, { Schema, Document } from 'mongoose';

export interface ResourceDocument extends Document {
  tokenId: number;
  collectionId: string;
  attributes: Record<string, unknown>;
}

const ResourceSchema: Schema = new Schema({
  tokenId: {
    type: Number,
    sparse: true,
    integer: true,
  },
  collectionId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  attributes: {
    type: Object,
    required: true,
  },
});

export default mongoose.model<ResourceDocument>('Resource', ResourceSchema);

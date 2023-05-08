import mongoose, { Schema, Document } from 'mongoose';

export interface AccessKeyDocument extends Document {
  key: string;
  userId: string;
  gameId: string;
  active: boolean;
}

const AccessKeySchema: Schema = new Schema({
  key: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
  },
  gameId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
});

AccessKeySchema.index({ key: 1, gameId: 1, active: 1 }, { unique: true });

export default mongoose.model<AccessKeyDocument>('AccessKey', AccessKeySchema);

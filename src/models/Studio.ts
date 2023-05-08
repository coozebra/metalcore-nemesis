import mongoose, { Schema, Document } from 'mongoose';

export interface StudioDocument extends Document {
  name: string;
}

const StudioSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model<StudioDocument>('Studio', StudioSchema);

import { Schema, model, Document, Types } from 'mongoose';

export interface ISector extends Document {
  name: string;
  city: Types.ObjectId;
}

const sectorSchema = new Schema<ISector>(
  {
    name: { type: String, required: true },
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true },
  },
  { timestamps: true }
);

// prevent duplicate sector names within the same city
sectorSchema.index({ city: 1, name: 1 }, { unique: true });

export default model<ISector>('Sector', sectorSchema);
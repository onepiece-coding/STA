import { Schema, model, Document } from 'mongoose';

export interface ICity extends Document {
  name: string;
}

const citySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default model<ICity>('City', citySchema);
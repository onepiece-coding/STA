import { Schema, model, Document, Types } from 'mongoose';

export interface ISupply extends Document {
  productId: Types.ObjectId;
  supplyDate: Date;
  quantity: number;
  remainingQty: number;
  expiringAt: Date;
}

const supplySchema = new Schema<ISupply>(
  {
    productId:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    supplyDate:  { type: Date,   required: true },
    quantity:    { type: Number, required: true },
    remainingQty:{ type: Number, required: true },
    expiringAt:  { type: Date,   required: true },
  },
  { timestamps: true }
);

supplySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export default model<ISupply>('Supply', supplySchema);
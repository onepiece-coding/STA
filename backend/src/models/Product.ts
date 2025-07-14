import { Schema, model, Document } from 'mongoose';

interface IImage {
  url: string;
  publicId: string | null;
}

export interface IProduct extends Document {
  categoryId: Schema.Types.ObjectId;
  name: string;
  pictureUrl: IImage;
  unitPrice: number;
  discountRule?: { minQty: number; percent: number };
  globalDiscountPercent?: number;
  currentStock: number;
  nextExpiryDate: Date;
}

const productSchema = new Schema<IProduct>({
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  pictureUrl: {
    url: { type: String, required: true, default: 'https://www.freepik.com/free-vector/new-product-concept-illustration_17056963.htm#fromView=search&page=1&position=1&uuid=64433e35-6048-43ba-b82f-5df414275388&query=Default+product' },
    publicId: { type: String, default: null }
  },
  unitPrice: { type: Number, required: true },
  discountRule: {
    minQty: Number,
    percent: Number
  },
  globalDiscountPercent: {
    type: Number,
    default: null
  },
  currentStock:       { type: Number, default: 0 },
  nextExpiryDate:     { type: Date,    default: null }
}, { timestamps: true });

export default model<IProduct>('Product', productSchema);
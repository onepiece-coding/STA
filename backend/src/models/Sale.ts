import { Schema, model, Document, Types } from 'mongoose';
import User from './User.js';

interface ILineItem {
  productId: Types.ObjectId;
  soldBy: 'unit' | 'carton';
  quantity: number;
  discount: number; // per‑unit discount %
  unitPrice: number; // final price per unit after discount
  total: number; // quantity * unitPrice
}

export interface ISale extends Document {
  saleNumber: string; // e.g. “S-20250712-0001”
  date: Date;
  client: Types.ObjectId;
  seller: Types.ObjectId;
  deliveryMan?: Types.ObjectId;
  items: ILineItem[];
  totalAmount: number; // sum of item totals
  deliveryStatus: 'ordered' | 'delivered' | 'notDelivered';
  return: {
    returnItems: ILineItem[];
    returnTotal: number;
  }; // returns on this sale
  returnGlobal: number; // ad‑hoc returns outside line items
  netAmount: number; // totalAmount − (sum of returns) − returnGlobal
  paymentMethod: 'espece' | 'card' | 'other';
  amountPaid: number;
  invoiceUrl?: string; // generated PDF link
}

const lineItem = new Schema<ILineItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  soldBy: { type: String, enum: ['unit', 'carton'], required: true },
  quantity: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const saleSchema = new Schema<ISale>(
  {
    saleNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: () => new Date() },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryMan: { type: Schema.Types.ObjectId, ref: 'User' },
    items: { type: [lineItem], required: true },
    totalAmount: { type: Number, required: true },
    deliveryStatus: {
      type: String,
      enum: ['ordered', 'delivered', 'notDelivered'],
      default: 'ordered',
    },
    return: {
      returnItems: { type: [lineItem], default: [] },
      returnTotal: { type: Number, default: 0 },
    },
    returnGlobal: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['espece', 'card', 'other'],
      default: 'espece',
    },
    amountPaid: { type: Number, default: 0 },
    invoiceUrl: { type: String },
  },
  { timestamps: true },
);

saleSchema.pre<ISale>('validate', async function () {
  const user = await User.findById(this.seller).select('role');
  if (user?.role === 'seller' && !this.client) {
    this.invalidate(
      'client',
      'Client is required when seller has role "seller".',
    );
  }
});

export default model<ISale>('Sale', saleSchema);

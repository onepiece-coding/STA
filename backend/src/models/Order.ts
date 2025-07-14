import { Schema, model, Document, Types } from 'mongoose';

interface IOrderItem {
  productId: Types.ObjectId;
  soldBy:    'unit' | 'carton';
  quantity:  number;
}

export interface IOrder extends Document {
  deliveryMan: Types.ObjectId;
  seller:      Types.ObjectId;
  client:      Types.ObjectId;
  items:       IOrderItem[];
  wantedDate:  Date;         // when the client needs it
  status:      'pending' | 'done' | 'cancelled';
  createdAt:   Date;
}

const orderItem = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  soldBy:    { type: String, enum: ['unit','carton'], required: true },
  quantity:  { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    deliveryMan: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    client:      { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    items:       { type: [orderItem], required: true },
    wantedDate:  { type: Date, required: true },
    status:      { 
      type: String, 
      enum: ['pending','done','cancelled'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

// TTL: auto‑delete 6 months (≈ 15552000 seconds) after creation
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

export default model<IOrder>('Order', orderSchema);
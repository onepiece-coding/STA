import { Schema, model, Document, Types } from 'mongoose';

interface IImage {
  url: string;
  publicId: string | null;
}

export interface IClient extends Document {
  clientNumber: string;
  name: string;
  location: string;
  placePicUrl?: IImage;
  typeOfBusiness: string;
  city: Types.ObjectId;
  sector: Types.ObjectId;
  phoneNumber: string;
  seller: Types.ObjectId;
  deliveryMan?: Types.ObjectId;
  numberOfOrders: number;
}

const clientSchema = new Schema<IClient>(
  {
    clientNumber:  { type: String, required: true, unique: true },
    name:          { type: String, required: true },
    location:      { type: String, required: true },
    placePicUrl: {
      url: { type: String, required: true, default: 'https://www.freepik.com/free-vector/shop-with-sign-open-design_8247029.htm#fromView=keyword&page=1&position=16&uuid=915939aa-24b9-448c-ada0-40321b261f09&query=Shop' },
      publicId: { type: String, default: null }
    },
    typeOfBusiness:{ type: String, required: true },
    city:          { type: Schema.Types.ObjectId, ref: 'City', required: true },
    sector:        { type: Schema.Types.ObjectId, ref: 'Sector', required: true },
    phoneNumber:   { type: String, required: true, unique: true, trim: true, match: [/^\+212(6|7)\d{8}$/, "invalid phone number"] },
    seller:        { type: Schema.Types.ObjectId, ref: 'User',   required: true },
    deliveryMan:   { type: Schema.Types.ObjectId, ref: 'User' },
    numberOfOrders:{ type: Number, default: 0 }
  },
  { timestamps: true }
);

export default model<IClient>('Client', clientSchema);
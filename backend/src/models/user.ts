import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin' | 'seller' | 'delivery';
  // seller only:
  sectors?: Types.ObjectId[];       // list of Sector IDs
  // delivery only:
  seller?: Types.ObjectId;          // parent Seller
  deliverySectors?: Types.ObjectId[]; // subset of that seller’s sectors
  canInstantSales?: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','seller','delivery'], required: true },
  sectors: [{ type: Schema.Types.ObjectId, ref: 'Sector' }],        // for sellers
  seller: { type: Schema.Types.ObjectId, ref: 'User' },            // for delivery men
  deliverySectors: [{ type: Schema.Types.ObjectId, ref: 'Sector' }],    // for delivery men
  canInstantSales: { type: Boolean, default: false }                    // for delivery men
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default model<IUser>('User', userSchema);
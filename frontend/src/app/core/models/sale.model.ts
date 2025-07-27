import { IClient } from './client.model';
import { IUser } from './user.model';

export type TItem = {
  productId: {
    _id: string;
    name: string;
  };
  soldBy?: string;
  quantity: number;
  discount?: number;
  unitPrice?: number;
  total?: number;
};

export interface ISale {
  _id: string;
  saleNumber: string;
  date: Date;
  client: IClient;
  seller: IUser;
  deliveryMan: IUser;
  items: TItem[];
  totalAmount: number;
  deliveryStatus: 'ordered' | 'delivered' | 'notDelivered';
  return: {
    returnTotal: number;
    returnItems: TItem[];
  };
  returnGlobal: number;
  netAmount: number;
  paymentMethod: 'espece' | 'card' | 'other';
  amountPaid: number;
}

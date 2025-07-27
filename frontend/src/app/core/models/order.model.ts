import { IClient } from './client.model';
import { IUser } from './user.model';

type TItem = {
  productId: { _id: string; name: string };
  quantity: number;
  soldBy: 'carton' | 'unit';
};

export interface IOrder {
  _id: string;
  deliveryMan: IUser;
  seller: IUser;
  client: IClient;
  items: TItem[];
  wantedDate: Date;
  status: 'pending' | 'done' | 'cancelled';
}

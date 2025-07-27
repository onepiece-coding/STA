import { ISector } from './sector.model';

export interface IUser {
  _id: string;
  username: string;
  role: 'admin' | 'seller' | 'delivery' | 'instant';
  deliverySectors: ISector[];
  sectors: ISector[];
  seller: { username: string };
}

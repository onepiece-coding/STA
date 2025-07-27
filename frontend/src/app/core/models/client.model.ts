import { ICity } from './city.model';
import { ISector } from './sector.model';
import { IUser } from './user.model';

export interface IClient {
  _id: string;
  clientNumber: string;
  name: string;
  location: string;
  placePicUrl: { url: string };
  typeOfBusiness: string;
  city: ICity;
  sector: ISector;
  phoneNumber: string;
  seller: IUser;
  deliveryMan: IUser;
  numberOfOrders: number;
}

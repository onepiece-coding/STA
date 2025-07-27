import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { TMeta } from '../../shared/types/meta.type';
import { IOrder } from '../models/order.model';
import { SalesService } from './sales.service';
import { dateFormat } from '../../shared/utils/date-format';

type TGetOrdersResponse = {
  data: IOrder[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private _salesService = inject(SalesService);

  createOrder(): Observable<IOrder> {
    return this.http.post<IOrder>(`${environment.API_BASE_URL}/orders`, {
      clientId: this._salesService.sale()?.clientId,
      wantedDate: this._salesService.sale()?.date,
      items: this._salesService.sale()?.items,
    });
  }

  getOrders(
    limit?: number,
    page?: number,
    dateDu?: string,
    dateAu?: string,
    status?: 'pending' | 'done' | 'cancelled' | ''
  ): Observable<TGetOrdersResponse> {
    console.log(dateAu);
    let params: Record<string, string | number> = {};
    if (page && limit) {
      params['page'] = page;
      params['limit'] = limit;
    }
    if (dateDu) params['from'] = dateFormat(dateDu);
    if (dateAu) params['to'] = dateFormat(dateAu);
    if (status) params['status'] = status;
    return this.http.get<TGetOrdersResponse>(
      `${environment.API_BASE_URL}/orders`,
      { params }
    );
  }

  updateOrder(
    orderId: string,
    orderStatus?: 'pending' | 'done' | 'cancelled',
    wantedDate?: Date
  ): Observable<IOrder> {
    let body: Record<string, any> = {};
    if (orderStatus) body['status'] = orderStatus;
    if (wantedDate) body['wantedDate'] = dateFormat(wantedDate.toString());
    return this.http.patch<IOrder>(
      `${environment.API_BASE_URL}/orders/${orderId}`,
      body
    );
  }

  deleteOrder(orderId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/orders/${orderId}`
    );
  }
}

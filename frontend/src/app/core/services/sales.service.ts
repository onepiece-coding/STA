import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { TMeta } from '../../shared/types/meta.type';
import { ISale } from '../models/sale.model';
import { TReturn, TSale } from '../../shared/types/sale.type';

type TGetSalesResponse = {
  data: ISale[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class SalesService {
  sale = signal<TSale | null>(null);

  private http = inject(HttpClient);

  createSale(path: string): Observable<ISale> {
    console.log('from createSale:', this.sale());
    return this.http.post<ISale>(
      `${environment.API_BASE_URL}/${path}`,
      this.sale()
    );
  }

  getSales(
    limit?: number,
    page?: number,
    dateDu?: string,
    dateAu?: string
  ): Observable<TGetSalesResponse> {
    let params: Record<string, string | number> = {};
    if (page && limit) {
      params['page'] = page;
      params['limit'] = limit;
    }
    if (dateDu && dateAu) {
      params['from'] = dateDu;
      params['to'] = dateAu;
    }
    return this.http.get<TGetSalesResponse>(
      `${environment.API_BASE_URL}/sales`,
      { params }
    );
  }

  updateSale(
    saleId: string,
    deliveryStatus?: 'ordered' | 'delivered' | 'notDelivered',
    retour?: TReturn,
    returnGlobal?: number,
    amountPaid?: number
  ): Observable<ISale> {
    let body: Record<string, any> = {};
    if (deliveryStatus) body['deliveryStatus'] = deliveryStatus;
    if (retour) body['return'] = retour;
    if (returnGlobal) body['returnGlobal'] = returnGlobal;
    if (amountPaid) body['amountPaid'] = amountPaid;
    return this.http.patch<ISale>(
      `${environment.API_BASE_URL}/sales/${saleId}`,
      body
    );
  }

  deleteSale(saleId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/sales/${saleId}`
    );
  }
}

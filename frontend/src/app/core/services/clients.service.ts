import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { IProduct } from '../models/product.model';
import { TMeta } from '../../shared/types/meta.type';
import { IClient } from '../models/client.model';

type TGetClientsResponse = {
  data: IClient[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private http = inject(HttpClient);

  createClient(formData: FormData): Observable<IClient> {
    return this.http.post<IClient>(
      `${environment.API_BASE_URL}/clients`,
      formData
    );
  }

  getClients(
    page = 1,
    cityId: string,
    sectorId: string,
    clientNumber?: string
  ): Observable<TGetClientsResponse> {
    let params: Record<string, string | number> = { page, cityId, sectorId };
    if (clientNumber) params['clientNumber'] = clientNumber;
    return this.http.get<TGetClientsResponse>(
      `${environment.API_BASE_URL}/clients`,
      { params }
    );
  }

  getClientById(clientId: string): Observable<IClient> {
    return this.http.get<IClient>(
      `${environment.API_BASE_URL}/clients/${clientId}`
    );
  }

  updateClient(clientId: string, formData: FormData): Observable<IClient> {
    return this.http.patch<IClient>(
      `${environment.API_BASE_URL}/clients/${clientId}`,
      formData
    );
  }

  deleteClient(clientId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/clients/${clientId}`
    );
  }
}

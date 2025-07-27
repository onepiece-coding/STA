import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { TStat } from '../../shared/types/stat.type';
import { dateFormat } from '../../shared/utils/date-format';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);

  getStats(from?: string, to?: string, seller?: string): Observable<TStat> {
    let params: Record<string, string | number> = {};
    if (from) params['from'] = dateFormat(from);
    if (to) params['to'] = dateFormat(to);
    if (seller) params['sellerId'] = seller;
    return this.http.get<TStat>(`${environment.API_BASE_URL}/stats`, {
      params,
    });
  }
}

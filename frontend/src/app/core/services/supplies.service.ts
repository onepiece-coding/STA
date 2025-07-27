import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { TAlert } from '../../shared/types/alert.type';
import { TSupply } from '../../shared/types/supply.type';

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private http = inject(HttpClient);

  supplies = signal<TSupply[]>([]);

  addBulkSupply() {
    return this.http.post(
      `${environment.API_BASE_URL}/supplies`,
      this.supplies()
    );
  }

  expiringSoonAlerts(days?: number, minQty?: number): Observable<TAlert[]> {
    let params: Record<string, string | number> = {};
    if (days) params['days'] = days;
    if (minQty) params['minQty'] = minQty;
    return this.http.get<TAlert[]>(
      `${environment.API_BASE_URL}/supplies/alerts/expiring`,
      { params }
    );
  }

  lowStockAlerts(threshold?: number): Observable<TAlert[]> {
    let params: Record<string, string | number> = {};
    if (threshold) params['threshold'] = threshold;
    return this.http.get<TAlert[]>(
      `${environment.API_BASE_URL}/supplies/alerts/low-stock`,
      { params }
    );
  }
}

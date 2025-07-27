import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { ISector } from '../models/sector.model';

@Injectable({ providedIn: 'root' })
export class SectorsService {
  private http = inject(HttpClient);

  createSector(sectorName: string, cityId: string): Observable<ISector> {
    return this.http.post<ISector>(`${environment.API_BASE_URL}/sectors`, {
      name: sectorName,
      city: cityId,
    });
  }

  getSectors(cityId: string): Observable<ISector[]> {
    return this.http.get<ISector[]>(
      `${environment.API_BASE_URL}/sectors/${cityId}/sectors`
    );
  }

  deleteSector(sectorId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/sectors/${sectorId}`
    );
  }
}

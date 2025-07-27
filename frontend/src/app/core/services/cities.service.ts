import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { TMeta } from '../../shared/types/meta.type';
import { ICity } from '../models/city.model';

type TGetCitiesResponse = {
  data: ICity[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class CitiesService {
  private http = inject(HttpClient);

  createCity(cityName: string): Observable<ICity> {
    return this.http.post<ICity>(`${environment.API_BASE_URL}/cities`, {
      name: cityName,
    });
  }

  getCities(
    limit?: number,
    page?: number,
    cityName?: string
  ): Observable<TGetCitiesResponse> {
    let params: Record<string, string | number> = {};
    if (cityName) params['search'] = cityName;
    if (page && limit) {
      params['page'] = page;
      params['limit'] = limit;
    }
    return this.http.get<TGetCitiesResponse>(
      `${environment.API_BASE_URL}/cities`,
      { params }
    );
  }

  updateCity(cityId: string, cityName: string): Observable<ICity> {
    return this.http.patch<ICity>(
      `${environment.API_BASE_URL}/cities/${cityId}`,
      { name: cityName }
    );
  }

  getCityById(cityId: string): Observable<ICity> {
    return this.http.get<ICity>(`${environment.API_BASE_URL}/cities/${cityId}`);
  }

  deleteCity(cityId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/cities/${cityId}`
    );
  }
}

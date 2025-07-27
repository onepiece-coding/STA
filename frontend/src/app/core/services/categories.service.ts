import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { ICategory } from '../models/categories.model';
import { TMeta } from '../../shared/types/meta.type';

type TGetCategoriesResponse = {
  data: ICategory[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);

  createCategory(categoryName: string): Observable<ICategory> {
    return this.http.post<ICategory>(`${environment.API_BASE_URL}/categories`, {
      name: categoryName,
    });
  }

  getCategories(
    limit?: number,
    page?: number,
    categoryName?: string
  ): Observable<TGetCategoriesResponse> {
    let params: Record<string, string | number> = {};
    if (categoryName) params['search'] = categoryName;
    if (page && limit) {
      params['page'] = page;
      params['limit'] = limit;
    }
    return this.http.get<TGetCategoriesResponse>(
      `${environment.API_BASE_URL}/categories`,
      { params }
    );
  }

  deleteCategory(categoryId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/categories/${categoryId}`
    );
  }
}

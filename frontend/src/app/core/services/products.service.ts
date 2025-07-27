import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { IProduct } from '../models/product.model';
import { TMeta } from '../../shared/types/meta.type';

type TGetProductsResponse = {
  data: IProduct[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  createProduct(formData: FormData): Observable<IProduct> {
    return this.http.post<IProduct>(
      `${environment.API_BASE_URL}/products`,
      formData
    );
  }

  getProducts(
    page = 1,
    categoryId?: string,
    productName?: string
  ): Observable<TGetProductsResponse> {
    let params: Record<string, string | number> = { page };
    if (categoryId) params['category'] = categoryId;
    if (productName) params['search'] = productName;
    return this.http.get<TGetProductsResponse>(
      `${environment.API_BASE_URL}/products`,
      { params }
    );
  }

  getDiscountedProducts(page = 1): Observable<TGetProductsResponse> {
    let params: Record<string, string | number> = { page };
    return this.http.get<TGetProductsResponse>(
      `${environment.API_BASE_URL}/products/discounts`,
      { params }
    );
  }

  getProductById(productId: string): Observable<IProduct> {
    return this.http.get<IProduct>(
      `${environment.API_BASE_URL}/products/${productId}`
    );
  }

  updateProduct(productId: string, formData: FormData): Observable<IProduct> {
    return this.http.patch<IProduct>(
      `${environment.API_BASE_URL}/products/${productId}`,
      formData
    );
  }

  deleteProduct(productId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/products/${productId}`
    );
  }
}

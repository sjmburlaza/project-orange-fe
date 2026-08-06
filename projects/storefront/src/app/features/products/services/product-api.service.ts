import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  InsurancePlan,
  MobilePlan,
  ProductAddon,
  Product,
  ProductConfigure,
  ProductFilters,
  ProductOptionsResponse,
} from '@orange/core/models';

@Injectable({
  providedIn: 'root',
})
export class ProductApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/products';

  getProducts(filters?: Partial<ProductFilters>): Observable<Product[]> {
    let params = new HttpParams();

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.categoryId != null) {
      params = params.set('categoryId', filters.categoryId);
    }

    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters?.minPrice != null) {
      params = params.set('minPrice', filters.minPrice);
    }

    if (filters?.maxPrice != null) {
      params = params.set('maxPrice', filters.maxPrice);
    }

    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  getSearchSuggestions(query: string): Observable<string[]> {
    const params = new HttpParams().set('query', query);

    return this.http.get<string[]>(`${this.baseUrl}/search/suggestions`, {
      params,
    });
  }

  getProductConfigure(id: number): Observable<ProductConfigure> {
    return this.http.get<ProductConfigure>(`${this.baseUrl}/${id}`);
  }

  getProductOptions(
    id: number,
    selectedOptions: Record<string, string> = {},
  ): Observable<ProductOptionsResponse> {
    let params = new HttpParams();

    for (const [code, value] of Object.entries(selectedOptions)) {
      if (value) {
        params = params.set(code, value);
      }
    }

    return this.http.get<ProductOptionsResponse>(
      `${this.baseUrl}/${id}/options`,
      { params },
    );
  }

  getProductAddons(id: number): Observable<ProductAddon[]> {
    return this.http.get<ProductAddon[]>(`${this.baseUrl}/${id}/addons`);
  }

  getProductInsurancePlans(id: number): Observable<InsurancePlan[]> {
    return this.http.get<InsurancePlan[]>(
      `${this.baseUrl}/${id}/insurance-plans`,
    );
  }

  getProductMobilePlans(id: number): Observable<MobilePlan[]> {
    return this.http.get<MobilePlan[]>(`${this.baseUrl}/${id}/mobile-plans`);
  }
}

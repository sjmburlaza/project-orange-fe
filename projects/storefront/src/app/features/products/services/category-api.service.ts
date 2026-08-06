import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/categories';

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }
}

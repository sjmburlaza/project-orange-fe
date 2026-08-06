import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Option } from '@orange/core/models';

@Injectable({
  providedIn: 'root',
})
export class OptionsService {
  private readonly http = inject(HttpClient);

  getOptions(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): Observable<Option[]> {
    let httpParams = new HttpParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<Option[]>(endpoint, {
      params: httpParams,
    });
  }
}

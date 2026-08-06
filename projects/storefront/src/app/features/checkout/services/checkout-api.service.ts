import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckoutFormConfig } from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/checkout';

  getCheckoutForm(): Observable<CheckoutFormConfig> {
    return this.http.get<CheckoutFormConfig>(`${this.baseUrl}/form`);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConfirmPaymentRequest,
  CreatePaymentIntentRequest,
  PaymentConfirmation,
  PaymentIntent,
} from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/payments';

  createIntent(request: CreatePaymentIntentRequest): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.baseUrl}/intents`, request);
  }

  confirmPayment(
    request: ConfirmPaymentRequest,
  ): Observable<PaymentConfirmation> {
    return this.http.post<PaymentConfirmation>(
      `${this.baseUrl}/confirm`,
      request,
    );
  }
}

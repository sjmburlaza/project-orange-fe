import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  OrderConfirmation,
  OrderItem,
  PlaceOrderRequest,
} from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/orders';

  getOrders(): Observable<OrderConfirmation[]> {
    return this.http.get<OrderConfirmation[]>(this.baseUrl);
  }

  placeOrder(request: PlaceOrderRequest): Observable<OrderConfirmation> {
    return this.http.post<OrderConfirmation>(this.baseUrl, request);
  }

  getOrder(orderNumber: string): Observable<OrderConfirmation> {
    return this.http.get<OrderConfirmation>(
      `${this.baseUrl}/${encodeURIComponent(orderNumber)}`,
    );
  }

  lookupOrder(
    orderNumber: string,
    email: string,
  ): Observable<OrderItem> {
    return this.http.get<OrderItem>(`${this.baseUrl}/lookup`, {
      params: { orderNumber, email },
    });
  }
}

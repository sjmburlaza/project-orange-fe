import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import {
  AnalyticsDashboard,
  AnalyticsDashboardPeriod,
  AnalyticsEvent,
} from '@orange/core/models';
import { Cart } from '@orange/core/models';
import { OrderConfirmation } from '@orange/core/models';
import { Product } from '@orange/core/models';
import {
  cartItemToAnalyticsItem,
  createEmptyDashboard,
  createId,
  dateKey,
  orderItemToAnalyticsItem,
  readCartTotal,
} from './analytics.helpers';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dashboardUrl = '/api/admin/analytics/dashboard';
  private readonly eventsUrl = '/api/analytics/events';
  private readonly visitorIdKey = 'orange.analytics.visitorId';
  private readonly sessionIdKey = 'orange.analytics.sessionId';
  private readonly dashboardSignal = signal<AnalyticsDashboard>(
    createEmptyDashboard(),
  );
  private latestDashboardRequest = 0;

  readonly dashboard = this.dashboardSignal.asReadonly();

  trackVisitor(): void {
    if (!this.canUseBrowserStorage()) return;

    const todayKey = dateKey(new Date());
    const sessionKey = `orange.analytics.visitor.${todayKey}`;

    if (this.readSessionStorage(sessionKey)) {
      return;
    }

    this.writeSessionStorage(sessionKey, 'true');
    this.record({ type: 'visitor' });
  }

  trackProductViews(products: Product[]): void {
    const visibleProducts = products.filter((product) => product.id);

    if (!visibleProducts.length) return;

    for (const product of visibleProducts) {
      if (this.hasSessionEvent(`product-view.${product.id}`)) {
        continue;
      }

      this.record({
        type: 'product_view',
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName ?? 'Uncategorized',
        value: product.price,
      });
    }
  }

  trackAddToCart(product: Product, quantity = 1): void {
    this.record({
      type: 'add_to_cart',
      productId: product.id,
      productName: product.name,
      categoryName: product.categoryName ?? 'Uncategorized',
      quantity,
      value: product.price * quantity,
    });
  }

  trackCheckoutStarted(cart: Cart | null): void {
    if (this.hasSessionEvent('checkout-start')) {
      return;
    }

    const items = cart?.entries.map(cartItemToAnalyticsItem) ?? [];

    this.record({
      type: 'checkout_start',
      value: readCartTotal(cart),
      items,
    });
  }

  trackPurchase(order: OrderConfirmation): void {
    if (
      order.orderNumber &&
      this.hasSessionEvent(`purchase.${order.orderNumber}`)
    ) {
      return;
    }

    this.record({
      type: 'purchase',
      orderNumber: order.orderNumber,
      value: order.totalAmount,
      items: order.items.map(orderItemToAnalyticsItem),
    });
  }

  trackPaymentFailure(cart: Cart | null, reason: string): void {
    this.record({
      type: 'payment_failure',
      value: readCartTotal(cart),
      failureReason: reason,
      items: cart?.entries.map(cartItemToAnalyticsItem) ?? [],
    });
  }

  loadDashboard(period: AnalyticsDashboardPeriod = 'last-7-days'): void {
    if (!this.canUseBrowserStorage()) return;

    const requestId = ++this.latestDashboardRequest;
    const params = new HttpParams().set('period', period);

    this.http
      .get<AnalyticsDashboard>(this.dashboardUrl, { params })
      .pipe(catchError(() => EMPTY))
      .subscribe((dashboard) => this.applyDashboard(dashboard, requestId));
  }

  private record(
    event: Omit<AnalyticsEvent, 'id' | 'occurredAt' | 'visitorId' | 'sessionId'>,
  ): void {
    if (!this.canUseBrowserStorage()) return;

    const nextEvent: AnalyticsEvent = {
      ...event,
      id: createId(event.type),
      occurredAt: new Date().toISOString(),
      visitorId: this.getVisitorId(),
      sessionId: this.getSessionId(),
    };
    const requestId = ++this.latestDashboardRequest;

    this.http
      .post<AnalyticsDashboard>(this.eventsUrl, { events: [nextEvent] })
      .pipe(catchError(() => EMPTY))
      .subscribe((dashboard) => this.applyDashboard(dashboard, requestId));
  }

  private applyDashboard(
    dashboard: AnalyticsDashboard,
    requestId: number,
  ): void {
    if (requestId === this.latestDashboardRequest) {
      this.dashboardSignal.set(dashboard);
    }
  }

  private hasSessionEvent(key: string): boolean {
    if (!this.canUseBrowserStorage()) return false;

    const todayKey = dateKey(new Date());
    const sessionKey = `orange.analytics.${key}.${todayKey}`;

    if (this.readSessionStorage(sessionKey)) {
      return true;
    }

    this.writeSessionStorage(sessionKey, 'true');
    return false;
  }

  private getVisitorId(): string {
    const savedVisitorId = this.readSessionStorage(this.visitorIdKey);

    if (savedVisitorId) {
      return savedVisitorId;
    }

    const visitorId = createId('visitor');
    this.writeSessionStorage(this.visitorIdKey, visitorId);

    return visitorId;
  }

  private getSessionId(): string {
    const savedSessionId = this.readSessionStorage(this.sessionIdKey);

    if (savedSessionId) {
      return savedSessionId;
    }

    const sessionId = createId('session');
    this.writeSessionStorage(this.sessionIdKey, sessionId);

    return sessionId;
  }

  private canUseBrowserStorage(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private readSessionStorage(key: string): string | null {
    if (!this.canUseBrowserStorage()) return null;

    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeSessionStorage(key: string, value: string): void {
    if (!this.canUseBrowserStorage()) return;

    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Analytics must never interrupt the shopping flow.
    }
  }
}

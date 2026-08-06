import {
  AnalyticsDailyPoint,
  AnalyticsDashboard,
  AnalyticsItem,
} from '@orange/core/models';
import { Cart, CartItem } from '@orange/core/models';
import { OrderProductItem } from '@orange/core/models';

export function createEmptyDashboard(): AnalyticsDashboard {
  const daily = buildEmptyDailyPoints();

  return {
    visitors: 0,
    productViews: 0,
    addToCarts: 0,
    checkoutStarts: 0,
    purchases: 0,
    revenue: 0,
    averageOrderValue: 0,
    addToCartRate: 0,
    checkoutStartRate: 0,
    purchaseConversionRate: 0,
    cartAbandonmentRate: 0,
    paymentFailures: 0,
    paymentFailureRate: 0,
    unitsSold: 0,
    daily,
    funnel: [
      { label: 'Visitors', value: 0, rateFromPrevious: 1, rateFromVisitors: 0 },
      {
        label: 'Product views',
        value: 0,
        rateFromPrevious: 0,
        rateFromVisitors: 0,
      },
      {
        label: 'Add to cart',
        value: 0,
        rateFromPrevious: 0,
        rateFromVisitors: 0,
      },
      {
        label: 'Checkout started',
        value: 0,
        rateFromPrevious: 0,
        rateFromVisitors: 0,
      },
      {
        label: 'Purchases',
        value: 0,
        rateFromPrevious: 0,
        rateFromVisitors: 0,
      },
    ],
    topProducts: [],
    topCategories: [],
    orders: [],
    paymentFailureEvents: [],
  };
}

export function cartItemToAnalyticsItem(item: CartItem): AnalyticsItem {
  return {
    productId: item.productId,
    productName: item.productName,
    categoryName: item.categoryName ?? 'Uncategorized',
    price: item.price,
    quantity: item.quantity,
  };
}

export function orderItemToAnalyticsItem(item: OrderProductItem): AnalyticsItem {
  return {
    productId: item.productId,
    productName: item.productName,
    categoryName: item.categoryName ?? 'Uncategorized',
    price: item.price,
    quantity: item.quantity,
  };
}

export function readCartTotal(cart: Cart | null): number {
  return cart?.cartSummary.find((item) => item.name === 'Total')?.amount ?? 0;
}

export function createId(prefix: string): string {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomId}`;
}

export function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function buildEmptyDailyPoints(): AnalyticsDailyPoint[] {
  const today = startOfDay(new Date());
  const points: AnalyticsDailyPoint[] = [];

  for (let day = 6; day >= 0; day -= 1) {
    const date = addDays(today, -day);

    points.push({
      dateKey: dateKey(date),
      label: date.toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
      }),
      visitors: 0,
      productViews: 0,
      addToCarts: 0,
      checkoutStarts: 0,
      purchases: 0,
      revenue: 0,
      paymentFailures: 0,
    });
  }

  return points;
}

function startOfDay(date: Date): Date {
  const nextDate = new Date(date);

  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

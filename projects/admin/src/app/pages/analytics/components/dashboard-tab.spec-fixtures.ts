import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import {
  AnalyticsDashboard,
  AnalyticsMetricCard,
} from '@orange/core/models';
import { WHITESPACE_PATTERN } from '@orange/shared/constants';

export async function renderTab<T>(
  component: Type<T>,
  inputs: Record<string, unknown>,
): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({
    imports: [component],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);

  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }

  fixture.detectChanges();

  return fixture;
}

export function textContent<T>(fixture: ComponentFixture<T>): string {
  return fixture.nativeElement.textContent
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();
}

export function firstBarWidth<T>(fixture: ComponentFixture<T>): string {
  const bar = fixture.nativeElement.querySelector('.bar__fill') as HTMLElement;

  return bar.style.width;
}

export const metricCards: AnalyticsMetricCard[] = [
  {
    label: 'Visitors',
    value: '1,200',
    helper: 'Unique visitors',
    info: 'Unique visitors recorded during the selected period.',
  },
  {
    label: 'Orders',
    value: '84',
    helper: 'Completed purchases',
    info: 'Completed purchase events in the selected period.',
    tone: 'good',
  },
];

export const dashboard: AnalyticsDashboard = {
  visitors: 1200,
  productViews: 3400,
  addToCarts: 420,
  checkoutStarts: 210,
  purchases: 84,
  revenue: 512000,
  averageOrderValue: 6095,
  addToCartRate: 0.1235,
  checkoutStartRate: 0.5,
  purchaseConversionRate: 0.07,
  cartAbandonmentRate: 0.8,
  paymentFailures: 3,
  paymentFailureRate: 0.0345,
  unitsSold: 96,
  daily: [
    {
      dateKey: '2026-06-18',
      label: 'Jun 18',
      visitors: 520,
      productViews: 1400,
      addToCarts: 180,
      checkoutStarts: 90,
      purchases: 36,
      revenue: 220000,
      paymentFailures: 1,
    },
    {
      dateKey: '2026-06-19',
      label: 'Jun 19',
      visitors: 680,
      productViews: 2000,
      addToCarts: 240,
      checkoutStarts: 120,
      purchases: 48,
      revenue: 292000,
      paymentFailures: 2,
    },
  ],
  funnel: [
    { label: 'Visitors', value: 1200, rateFromPrevious: 1, rateFromVisitors: 1 },
    {
      label: 'Product views',
      value: 3400,
      rateFromPrevious: 2.833,
      rateFromVisitors: 2.833,
    },
    {
      label: 'Add to cart',
      value: 420,
      rateFromPrevious: 0.1235,
      rateFromVisitors: 0.35,
    },
    {
      label: 'Checkout started',
      value: 210,
      rateFromPrevious: 0.5,
      rateFromVisitors: 0.175,
    },
    {
      label: 'Purchases',
      value: 84,
      rateFromPrevious: 0.4,
      rateFromVisitors: 0.07,
    },
  ],
  topProducts: [
    {
      productId: 1,
      productName: 'iPhone 15',
      categoryName: 'Phones',
      views: 1800,
      addToCarts: 260,
      unitsSold: 64,
      revenue: 383936,
      conversionRate: 0.0356,
    },
  ],
  topCategories: [
    {
      categoryName: 'Phones',
      views: 1800,
      addToCarts: 260,
      unitsSold: 64,
      revenue: 383936,
      conversionRate: 0.0356,
    },
  ],
  orders: [
    {
      orderNumber: 'OR-20260618-0007',
      occurredAt: '2026-06-18T10:30:00.000Z',
      items: [
        {
          productId: 1,
          productName: 'iPhone 15',
          categoryName: 'Phones',
          price: 59999,
          quantity: 1,
        },
      ],
      units: 96,
      revenue: 512000,
    },
  ],
  paymentFailureEvents: [
    {
      id: 'failure-e2e',
      occurredAt: '2026-06-19T10:30:00.000Z',
      amount: 59999,
      reason: 'Payment authorization timed out',
      items: [],
    },
  ],
};

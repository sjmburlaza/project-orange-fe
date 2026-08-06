export type AnalyticsEventType =
  | 'visitor'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase'
  | 'payment_failure';

export interface AnalyticsItem {
  productId: number;
  productName: string;
  categoryName: string;
  price: number;
  quantity: number;
}

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  occurredAt: string;
  visitorId: string;
  sessionId: string;
  productId?: number;
  productName?: string;
  categoryName?: string;
  quantity?: number;
  value?: number;
  orderNumber?: string;
  failureReason?: string;
  items?: AnalyticsItem[];
}

export interface AnalyticsMetricCard {
  label: string;
  value: string;
  helper: string;
  info: string;
  tone?: 'default' | 'good' | 'warning' | 'danger';
}

export type AnalyticsDashboardPeriod =
  | 'last-7-days'
  | 'past-month'
  | 'past-year'
  | 'from-start';

export interface AnalyticsDailyPoint {
  dateKey: string;
  label: string;
  visitors: number;
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  paymentFailures: number;
}

export interface AnalyticsFunnelStep {
  label: string;
  value: number;
  rateFromPrevious: number;
  rateFromVisitors: number;
}

export interface AnalyticsTopProduct {
  productId: number;
  productName: string;
  categoryName: string;
  views: number;
  addToCarts: number;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
}

export interface AnalyticsTopCategory {
  categoryName: string;
  views: number;
  addToCarts: number;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
}

export interface AnalyticsOrderSummary {
  orderNumber: string;
  occurredAt: string;
  items: AnalyticsItem[];
  units: number;
  revenue: number;
}

export interface AnalyticsPaymentFailureSummary {
  id: string;
  occurredAt: string;
  amount: number;
  reason: string;
  items: AnalyticsItem[];
}

export interface AnalyticsDashboard {
  visitors: number;
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  averageOrderValue: number;
  addToCartRate: number;
  checkoutStartRate: number;
  purchaseConversionRate: number;
  cartAbandonmentRate: number;
  paymentFailures: number;
  paymentFailureRate: number;
  unitsSold: number;
  daily: AnalyticsDailyPoint[];
  funnel: AnalyticsFunnelStep[];
  topProducts: AnalyticsTopProduct[];
  topCategories: AnalyticsTopCategory[];
  orders: AnalyticsOrderSummary[];
  paymentFailureEvents: AnalyticsPaymentFailureSummary[];
}

import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalyticsDashboard } from '@orange/core/models';
import { Cart } from '@orange/core/models';
import { OrderConfirmation } from '@orange/core/models';
import { Product } from '@orange/core/models';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AnalyticsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('does not load the admin dashboard when the service is created', () => {
    http.expectNone('/api/admin/analytics/dashboard');
  });

  it('loads the ecommerce analytics dashboard from the API on demand', () => {
    const dashboard = createDashboard({ visitors: 42, revenue: 180000 });

    service.loadDashboard();

    const req = http.expectOne(
      (request) =>
        request.url === '/api/admin/analytics/dashboard' &&
        request.params.get('period') === 'last-7-days',
    );

    expect(req.request.method).toBe('GET');
    req.flush(dashboard);

    expect(service.dashboard()).toEqual(dashboard);
  });

  it('loads the dashboard for the requested analytics period', () => {
    const dashboard = createDashboard({ visitors: 100, revenue: 250000 });

    service.loadDashboard('past-year');

    const req = http.expectOne(
      (request) =>
        request.url === '/api/admin/analytics/dashboard' &&
        request.params.get('period') === 'past-year',
    );

    expect(req.request.method).toBe('GET');
    req.flush(dashboard);

    expect(service.dashboard()).toEqual(dashboard);
  });

  it('records add-to-cart events through the analytics API', () => {
    const product = createProduct();
    const updatedDashboard = createDashboard({
      addToCarts: 1,
      addToCartRate: 0.25,
    });

    service.trackAddToCart(product, 2);

    const req = http.expectOne('/api/analytics/events');

    expect(req.request.method).toBe('POST');
    expect(req.request.body.events).toEqual([
      expect.objectContaining({
        type: 'add_to_cart',
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName,
        quantity: 2,
        value: product.price * 2,
      }),
    ]);

    req.flush(updatedDashboard);

    expect(service.dashboard()).toEqual(updatedDashboard);
  });

  it('records purchases once per order number in the current session', () => {
    const product = createProduct();
    const order = createOrder(product);
    const updatedDashboard = createDashboard({
      purchases: 1,
      revenue: order.totalAmount,
    });

    service.trackPurchase(order);

    const req = http.expectOne('/api/analytics/events');

    expect(req.request.method).toBe('POST');
    expect(req.request.body.events).toEqual([
      expect.objectContaining({
        type: 'purchase',
        orderNumber: order.orderNumber,
        value: order.totalAmount,
      }),
    ]);

    req.flush(updatedDashboard);

    service.trackPurchase(order);

    http.expectNone('/api/analytics/events');
    expect(service.dashboard()).toEqual(updatedDashboard);
  });

  it('records checkout and payment failure events through the analytics API', () => {
    const product = createProduct();
    const cart = createCart(product);

    service.trackCheckoutStarted(cart);

    const checkoutReq = http.expectOne('/api/analytics/events');

    expect(checkoutReq.request.body.events[0]).toEqual(
      expect.objectContaining({
        type: 'checkout_start',
        value: product.price,
      }),
    );

    checkoutReq.flush(createDashboard({ checkoutStarts: 1 }));

    service.trackPaymentFailure(cart, 'Issuer declined the card');

    const failureReq = http.expectOne('/api/analytics/events');

    expect(failureReq.request.body.events[0]).toEqual(
      expect.objectContaining({
        type: 'payment_failure',
        failureReason: 'Issuer declined the card',
        value: product.price,
      }),
    );

    failureReq.flush(createDashboard({ paymentFailures: 1 }));
  });
});

function createDashboard(
  overrides: Partial<AnalyticsDashboard> = {},
): AnalyticsDashboard {
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
    daily: [],
    funnel: [],
    topProducts: [],
    topCategories: [],
    orders: [],
    paymentFailureEvents: [],
    ...overrides,
  };
}

function createProduct(): Product {
  return {
    id: 101,
    name: 'Orange Test Phone',
    description: 'Test phone',
    price: 42000,
    stockQuantity: 7,
    imageUrl: '',
    categoryId: 1,
    categoryName: 'Phones',
  };
}

function createCart(product: Product): Cart {
  return {
    code: 'analytics-test-cart',
    entries: [
      {
        productId: product.id,
        variantId: product.id * 1000 + 1,
        productName: product.name,
        price: product.price,
        quantity: 1,
        totalPrice: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        categoryName: product.categoryName,
        itemSpecs: [],
        addons: [],
      },
    ],
    appliedVouchers: [],
    cartSummary: [{ name: 'Total', amount: product.price }],
  };
}

function createOrder(product: Product): OrderConfirmation {
  return {
    orderNumber: 'OR-ANALYTICS-TEST',
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    items: [
      {
        productId: product.id,
        productName: product.name,
        price: product.price,
        totalPrice: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        categoryName: product.categoryName,
        itemSpecs: [],
      },
    ],
    shippingAddress: {
      recipientName: 'Ada Lovelace',
      mobileNumber: '09171234567',
      addressLine1: '123 Orange Avenue',
      city: 'Manila',
      postalCode: '1000',
      country: 'PH',
    },
    deliveryEstimate: '3-5 business days',
    totalAmount: product.price,
    nextSteps: [],
    placedAt: new Date().toISOString(),
  };
}

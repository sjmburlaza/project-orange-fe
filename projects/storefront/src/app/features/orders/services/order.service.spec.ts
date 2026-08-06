import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  OrderConfirmation,
  PlaceOrderRequest,
} from '@orange/core/models';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let http: HttpTestingController;

  const order: OrderConfirmation = {
    orderNumber: 'OR-20260618-1234',
    customerEmail: 'ada@example.com',
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    items: [
      {
        productId: 1,
        productName: 'iPhone 15',
        price: 59999,
        totalPrice: 59999,
        quantity: 1,
        imageUrl: '',
        categoryName: 'Phones',
        itemSpecs: [],
      },
    ],
    shippingAddress: {
      recipientName: 'Ada Lovelace',
      mobileNumber: '09171234567',
      addressLine1: '123 Orange Avenue',
      city: 'Manila',
      postalCode: '1000',
      country: 'Philippines',
    },
    deliveryEstimate: '3-5 business days',
    totalAmount: 59999,
    nextSteps: ['Your payment has been processed successfully.'],
    placedAt: '2026-06-18T00:00:00.000Z',
  };

  const request: PlaceOrderRequest = {
    checkoutData: {
      customer: {
        email: 'ada@example.com',
      },
    },
    cart: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads orders from the orders API', () => {
    service.getOrders().subscribe((orders) => {
      expect(orders).toEqual([order]);
    });

    const req = http.expectOne('/api/orders');

    expect(req.request.method).toBe('GET');
    req.flush([order]);
  });

  it('loads an order by order number from the orders API', () => {
    service.getOrder(order.orderNumber).subscribe((result) => {
      expect(result).toEqual(order);
    });

    const req = http.expectOne(`/api/orders/${order.orderNumber}`);

    expect(req.request.method).toBe('GET');
    req.flush(order);
  });

  it('looks up an order by order number and email from the orders API', () => {
    service.lookupOrder(order.orderNumber, order.customerEmail ?? '').subscribe((result) => {
      expect(result).toEqual(order);
    });

    const req = http.expectOne(
      (request) =>
        request.url === '/api/orders/lookup' &&
        request.params.get('orderNumber') === order.orderNumber &&
        request.params.get('email') === order.customerEmail,
    );

    expect(req.request.method).toBe('GET');
    req.flush(order);
  });

  it('places an order through the orders API', () => {
    service.placeOrder(request).subscribe((result) => {
      expect(result).toEqual(order);
    });

    const req = http.expectOne('/api/orders');

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(order);
  });
});

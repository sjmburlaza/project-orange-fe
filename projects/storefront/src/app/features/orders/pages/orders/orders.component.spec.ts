import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

import { AuthSession } from '@orange/core/models';
import {
  AuthSessionState,
  AuthStore,
} from '@orange/core/auth';
import { OrderItem } from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { OrderService } from 'src/app/features/orders/services/order.service';
import { OrdersComponent } from './orders.component';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let orderService: {
    lookupOrder: ReturnType<typeof vi.fn>;
    getOrders: ReturnType<typeof vi.fn>;
  };
  let authSession: BehaviorSubject<AuthSessionState>;

  const order: OrderItem = {
    orderNumber: 'OR-20260618-0001',
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
        itemSpecs: [{ name: 'Storage', value: '128 GB' }],
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
    nextSteps: ['We will notify you when the order starts processing.'],
    placedAt: '2026-06-18T00:00:00.000Z',
  };

  const session: AuthSession = {
    user: {
      id: 'user-1',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      roles: ['customer'],
      permissions: [],
    },
    session: {
      id: 'session-1',
      createdAtUtc: '2026-06-18T00:00:00.000Z',
      expiresAtUtc: '2026-06-19T00:00:00.000Z',
    },
  };

  beforeEach(async () => {
    authSession = new BehaviorSubject<AuthSessionState>(null);
    orderService = {
      lookupOrder: vi.fn(),
      getOrders: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        provideNoopAnimations(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: OrderService,
          useValue: orderService,
        },
        {
          provide: AuthStore,
          useValue: {
            session$: authSession.asObservable(),
            getSessionSnapshot: () => authSession.value,
          },
        },
        {
          provide: SiteService,
          useValue: {
            currency: () => 'PHP',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the form touched when submitted empty', () => {
    component.onSubmit();

    expect(component.orderNumber.touched).toBe(true);
    expect(component.email.touched).toBe(true);
    expect(orderService.lookupOrder).not.toHaveBeenCalled();
  });

  it('looks up and displays a valid order', () => {
    orderService.lookupOrder.mockReturnValue(of(order));
    component.lookupForm.setValue({
      orderNumber: ` ${order.orderNumber} `,
      email: ' ada@example.com ',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(orderService.lookupOrder).toHaveBeenCalledWith(
      order.orderNumber,
      'ada@example.com',
    );
    expect(component.order()).toEqual(order);
    expect(component.errorMessage()).toBe('');
  });

  it('shows an order missing message when lookup fails', () => {
    orderService.lookupOrder.mockReturnValue(
      throwError(() => new Error('not found')),
    );
    component.lookupForm.setValue({
      orderNumber: 'OR-DOES-NOT-EXIST',
      email: 'ada@example.com',
    });

    component.onSubmit();

    expect(component.order()).toBeNull();
    expect(component.errorMessage()).toBe('orders.lookup.errors.notFound');
  });

  it('does not display an order returned for a different email', () => {
    orderService.lookupOrder.mockReturnValue(of(order));
    component.lookupForm.setValue({
      orderNumber: order.orderNumber,
      email: 'grace@example.com',
    });

    component.onSubmit();

    expect(component.order()).toBeNull();
    expect(component.errorMessage()).toBe('orders.lookup.errors.notFound');
  });

  it('loads order history for authenticated users', () => {
    orderService.getOrders.mockReturnValue(of([order]));

    authSession.next(session);
    fixture.detectChanges();

    expect(orderService.getOrders).toHaveBeenCalled();
    expect(component.ordersHistory()).toEqual([order]);
    expect(component.isAuthenticated()).toBe(true);
  });
});

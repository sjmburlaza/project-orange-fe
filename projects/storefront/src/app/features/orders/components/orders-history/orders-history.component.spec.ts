import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { OrderItem } from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { OrderItemComponent } from 'src/app/features/orders/components/order-item/order-item.component';

import { OrdersHistoryComponent } from './orders-history.component';

describe('OrdersHistoryComponent', () => {
  let component: OrdersHistoryComponent;
  let fixture: ComponentFixture<OrdersHistoryComponent>;

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
    nextSteps: [],
    placedAt: '2026-06-18T00:00:00.000Z',
  };
  const secondOrder: OrderItem = {
    ...order,
    orderNumber: 'OR-20260619-0002',
    orderStatus: 'delivered',
    placedAt: '2026-06-19T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersHistoryComponent],
      providers: [
        provideNoopAnimations(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: SiteService,
          useValue: {
            currency: () => 'PHP',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows an empty state when there are no orders', () => {
    const emptyState = fixture.nativeElement.querySelector('.history-state');

    expect(emptyState?.textContent).toContain('orders.history.emptyState');
  });

  it('renders order items when orders are provided', () => {
    fixture.componentRef.setInput('orders', [order]);
    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.directive(OrderItemComponent)),
    ).toHaveLength(1);
  });

  it('filters orders by order number', () => {
    fixture.componentRef.setInput('orders', [order, secondOrder]);
    component.setSearchTerm('0002');
    fixture.detectChanges();

    const orderItems = fixture.debugElement.queryAll(
      By.directive(OrderItemComponent),
    );

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].componentInstance.order()).toEqual(secondOrder);
  });

  it('shows a no-results state when the order number search misses', () => {
    fixture.componentRef.setInput('orders', [order]);
    component.setSearchTerm('missing-order');
    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.directive(OrderItemComponent)),
    ).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain(
      'orders.history.noSearchResults',
    );
  });
});

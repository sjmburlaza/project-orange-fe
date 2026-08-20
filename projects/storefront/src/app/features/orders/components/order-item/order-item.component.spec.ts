import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { OrderItem, OrderStatus } from '@orange/core/models';
import { SiteService } from '@orange/core/services';

import { OrderItemComponent } from './order-item.component';

describe('OrderItemComponent', () => {
  let component: OrderItemComponent;
  let fixture: ComponentFixture<OrderItemComponent>;

  const order: OrderItem = {
    orderNumber: 'OR-20260618-0001',
    customerEmail: 'ada@example.com',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    items: [
      {
        productId: 1,
        productName: 'Galaxy S25 Ultra',
        price: 84990,
        totalPrice: 84990,
        quantity: 1,
        imageUrl: '',
        categoryName: 'Phones',
        itemSpecs: [
          { name: 'Storage', value: '512GB' },
          { name: 'Color', value: 'Titanium Black' },
        ],
        addons: [
          {
            id: 'insurance',
            name: 'Device protection',
            title: 'Device protection',
            description: 'Coverage for accidental damage.',
            imageUrl: '',
            isAdded: true,
            amount: 499,
            billingFrequency: 'month',
          },
          {
            id: 'trade-in',
            name: 'Trade in',
            title: 'Trade in',
            description: 'Trade in an old device.',
            imageUrl: '',
            isAdded: false,
          },
        ],
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
    deliveredAt: '2026-06-21T00:00:00.000Z',
    trackingNumber: 'ABC123456',
    courier: 'Orange Express',
    invoiceUrl: '/invoice.pdf',
    subtotalAmount: 84990,
    totalAmount: 79990,
    discountAmount: 5000,
    shippingAmount: 0,
    nextSteps: [],
    placedAt: '2026-06-19T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderItemComponent],
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

    fixture = TestBed.createComponent(OrderItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('order', order);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts collapsed and expands on request', () => {
    expect(component.isExpanded()).toBe(false);

    component.setExpanded(true);

    expect(component.isExpanded()).toBe(true);
  });

  it('renders the backend-provided payment summary', () => {
    component.setExpanded(true);
    fixture.detectChanges();

    const summaryText = fixture.nativeElement.querySelector(
      '.payment-summary',
    )?.textContent;

    expect(summaryText).toContain('84,990.00');
    expect(summaryText).toContain('0.00');
    expect(summaryText).toContain('-');
    expect(summaryText).toContain('5,000.00');
  });

  it('omits optional payment summary rows when amounts are unavailable', () => {
    fixture.componentRef.setInput('order', {
      ...order,
      subtotalAmount: undefined,
      shippingAmount: undefined,
      discountAmount: undefined,
    });
    component.setExpanded(true);
    fixture.detectChanges();

    const summaryText = fixture.nativeElement.querySelector(
      '.payment-summary',
    )?.textContent;

    expect(summaryText).not.toContain('orders.lookup.subtotal');
    expect(summaryText).not.toContain('orders.lookup.shipping');
    expect(summaryText).not.toContain('orders.lookup.discount');
    expect(summaryText).toContain('orders.lookup.total');
    expect(summaryText).toContain('79,990.00');
  });

  it('displays added add-ons for each product row', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('orders.lookup.addons');
    expect(textContent).toContain('Device protection');
    expect(textContent).toContain('month');
    expect(textContent).not.toContain('Trade in');
  });

  it('uses cart-style fallback icons for product images and add-ons', () => {
    expect(fixture.nativeElement.querySelector('.bi-phone')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.bi-shield-check')).toBeTruthy();
  });

  it('maps every order status to its visual tone', () => {
    const statusTones: [OrderStatus, string][] = [
      ['pending_payment', 'warning'],
      ['confirmed', 'success'],
      ['processing', 'info'],
      ['packed', 'info'],
      ['shipped', 'info'],
      ['out_for_delivery', 'info'],
      ['delivered', 'success'],
      ['cancelled', 'neutral'],
      ['payment_failed', 'error'],
      ['refunded', 'info'],
      ['returned', 'neutral'],
    ];

    for (const [orderStatus, tone] of statusTones) {
      fixture.componentRef.setInput('order', { ...order, orderStatus });
      fixture.detectChanges();

      expect(component.orderStatusTone()).toBe(tone);
    }
  });

  it('derives pending delivery details, product fallbacks, and actions', () => {
    const pendingOrder: OrderItem = {
      ...order,
      orderStatus: 'pending_payment',
      paymentStatus: 'pending',
      deliveredAt: undefined,
      invoiceUrl: undefined,
      items: [
        {
          ...order.items[0],
          addons: undefined,
          itemSpecs: [{ name: 'Optional', value: '' }],
        },
      ],
    };
    fixture.componentRef.setInput('order', pendingOrder);
    fixture.detectChanges();

    expect(component.deliveryInfo()).toEqual({
      date: pendingOrder.deliveryEstimate,
      isDelivered: false,
      label: 'orders.lookup.estimatedDeliveryPrefix',
    });
    expect(component.displayItems()[0]).toMatchObject({
      addedAddons: [],
      specs: '',
    });
    expect(component.orderActions()).toEqual({
      canCancel: true,
      canChangePayment: true,
      canPayNow: true,
      canTrack: false,
      canBuyAgain: false,
      canReview: false,
      canReturn: false,
      canDownloadInvoice: false,
    });

    fixture.componentRef.setInput('order', {
      ...pendingOrder,
      orderStatus: 'shipped',
      paymentStatus: 'paid',
    });
    expect(component.orderActions().canTrack).toBe(true);

    fixture.componentRef.setInput('order', {
      ...pendingOrder,
      orderStatus: 'cancelled',
      paymentStatus: 'cancelled',
    });
    expect(component.orderActions().canBuyAgain).toBe(true);
  });
});

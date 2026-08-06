import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthSession } from '@orange/core/models';
import { AuthStore } from '@orange/core/auth';
import { Cart } from '@orange/core/models';
import { CheckoutFormConfig } from '@orange/core/models';
import {
  PaymentConfirmation,
  PaymentIntent,
} from '@orange/core/models';
import { AnalyticsService } from '@orange/core/services';
import { SiteService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import { OrderService } from 'src/app/features/orders/services/order.service';
import { CardPaymentMethodComponent } from '../components/payment-step/card-payment-method/card-payment-method.component';
import { PaymentStepComponent } from '../components/payment-step/payment-step.component';
import { CheckoutApiService } from '../services/checkout-api.service';
import { CheckoutStorageService } from '../services/checkout-storage.service';
import { PaymentApiService } from '../services/payment-api.service';
import chinaCheckoutFormFixture from '../../../../../../../mock-api/checkout-forms/cn.json';

import { CheckoutComponent } from './checkout.component';

const chinaCheckoutForm =
  chinaCheckoutFormFixture as unknown as CheckoutFormConfig;

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let authStore: AuthStore;
  let checkoutStorage: CheckoutStorageService;
  let currentSite: string;
  let paymentApiService: {
    createIntent: ReturnType<typeof vi.fn>;
    confirmPayment: ReturnType<typeof vi.fn>;
  };
  let orderService: {
    placeOrder: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    localStorage.clear();
    currentSite = 'ph';
    paymentApiService = {
      createIntent: vi.fn(() => of(createPaymentIntent())),
      confirmPayment: vi.fn(() => of(createPaymentConfirmation('success'))),
    };
    orderService = {
      placeOrder: vi.fn(() => of(createOrderConfirmation())),
    };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: CheckoutApiService,
          useValue: {
            getCheckoutForm: () =>
              of(
                currentSite === 'cn'
                  ? chinaCheckoutForm
                  : createCheckoutFormConfig(),
              ),
          },
        },
        {
          provide: CartFacade,
          useValue: {
            cart$: of(createCart()),
            updateShipping: vi.fn(),
            clearCart: vi.fn(),
          },
        },
        {
          provide: OrderService,
          useValue: orderService,
        },
        {
          provide: PaymentApiService,
          useValue: paymentApiService,
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(() => Promise.resolve(true)),
          },
        },
        {
          provide: SiteService,
          useValue: {
            getCurrentSite: () => currentSite,
            currency: signal('PHP'),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackCheckoutStarted: vi.fn(),
            trackPurchase: vi.fn(),
            trackPaymentFailure: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    authStore = TestBed.inject(AuthStore);
    checkoutStorage = TestBed.inject(CheckoutStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('prefills and disables the customer email field for authenticated users', () => {
    checkoutStorage.saveStep('customer', {
      email: 'guest@example.com',
      firstName: 'Ada',
    });
    authStore.setSession(createSession('ada@example.com'));
    createComponent();

    const customerStep = component.steps().find((step) => step.id === 'customer');
    const emailField = customerStep?.fields?.find(
      (field) => field.name === 'email',
    );
    const emailInput = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement | null;

    expect(emailField).toMatchObject({
      defaultValue: 'ada@example.com',
      disabled: true,
    });
    expect(component.getDynamicFormInitialValue('customer')).toEqual({
      email: 'ada@example.com',
      firstName: 'Ada',
    });
    expect(emailInput?.value).toBe('ada@example.com');
    expect(emailInput?.disabled).toBe(true);
  });

  it('leaves the customer email field editable for guests', () => {
    checkoutStorage.saveStep('customer', {
      email: 'guest@example.com',
    });
    authStore.clearSession();
    createComponent();

    const customerStep = component.steps().find((step) => step.id === 'customer');
    const emailField = customerStep?.fields?.find(
      (field) => field.name === 'email',
    );
    const emailInput = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement | null;

    expect(emailField?.disabled).toBeUndefined();
    expect(component.getDynamicFormInitialValue('customer')).toEqual({
      email: 'guest@example.com',
    });
    expect(emailInput?.value).toBe('guest@example.com');
    expect(emailInput?.disabled).toBe(false);
  });

  it('uses China payment methods returned by the checkout config', () => {
    currentSite = 'cn';
    createComponent();

    const paymentStep = component.steps().find((step) => step.id === 'payment');
    const paymentField = paymentStep?.fields?.find(
      (field) => field.name === 'paymentMethod',
    );

    expect(paymentField?.options).toEqual(
      getPaymentMethodField(chinaCheckoutForm)?.options,
    );
  });

  it('confirms payment before placing the order', async () => {
    createComponent();
    component.steps.set([
      {
        id: 'payment',
        label: 'Payment',
        fields: [createPaymentMethodField()],
      },
    ]);
    fixture.detectChanges();

    const paymentStep = component.activeStep as PaymentStepComponent;

    paymentStep.selectPayment('card');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cardMethod = fixture.debugElement.query(
      By.directive(CardPaymentMethodComponent),
    ).componentInstance as CardPaymentMethodComponent;

    cardMethod.form.patchValue({
      cardholderName: 'Ada Lovelace',
      cardNumber: '4242 4242 4242 1111',
      expiryDate: '12/30',
      securityCode: '123',
    });
    paymentStep.paymentForm.patchValue({
      termsAccepted: true,
    });

    component.next();
    await fixture.whenStable();

    expect(paymentApiService.createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        currency: 'PHP',
        paymentMethods: ['card', 'gcash', 'cod'],
      }),
    );
    expect(paymentApiService.confirmPayment).toHaveBeenCalledWith({
      intentId: 'pi_mock_test',
      paymentMethod: 'card',
      paymentDetails: expect.objectContaining({
        paymentMethod: 'card',
        cardLast4: '1111',
        termsAccepted: true,
      }),
    });
    expect(orderService.placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutData: expect.objectContaining({
          payment: expect.objectContaining({
            paymentIntentId: 'pi_mock_test',
            paymentStatus: 'success',
            paymentTransactionId: 'txn_mock_test',
          }),
        }),
      }),
    );
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});

function createCheckoutFormConfig(): CheckoutFormConfig {
  return {
    version: '1.0',
    steps: [
      {
        id: 'customer',
        label: 'Customer Details',
        fields: [
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            validators: [{ name: 'required' }, { name: 'email' }],
            grid: {
              mobile: 12,
              desktop: 12,
            },
          },
          {
            name: 'firstName',
            type: 'text',
            label: 'First Name',
          },
        ],
      },
      {
        id: 'shipping',
        label: 'Shipping',
        fields: [],
      },
      {
        id: 'payment',
        label: 'Payment',
        fields: [createPaymentMethodField()],
      },
    ],
  };
}

function getPaymentMethodField(config: CheckoutFormConfig) {
  return config.steps
    .find((step) => step.id === 'payment')
    ?.fields?.find((field) => field.name === 'paymentMethod');
}

function createPaymentMethodField() {
  return {
    name: 'paymentMethod',
    type: 'select' as const,
    label: 'Payment Method',
    validators: [{ name: 'required' }],
    options: [
      { label: 'Credit / Debit Card', value: 'card', icon: 'credit_card' },
      { label: 'GCash', value: 'gcash', icon: 'account_balance_wallet' },
      { label: 'Cash on Delivery', value: 'cod', icon: 'payments' },
    ],
  };
}

function createCart(): Cart {
  return {
    code: 'cart-1',
    entries: [
      {
        productId: 1,
        variantId: 1001,
        productName: 'Phone',
        price: 1000,
        quantity: 1,
        totalPrice: 1000,
        stockQuantity: 5,
        imageUrl: '',
        itemSpecs: [],
        addons: [],
      },
    ],
    appliedVouchers: [],
    cartSummary: [{ name: 'Total', amount: 1000 }],
  };
}

function createPaymentIntent(): PaymentIntent {
  return {
    id: 'pi_mock_test',
    clientSecret: 'secret_mock_test',
    amount: 1000,
    currency: 'PHP',
    status: 'requires_confirmation',
    createdAtUtc: '2026-06-30T00:00:00.000Z',
    expiresAtUtc: '2026-06-30T00:15:00.000Z',
    paymentMethods: [
      { code: 'card', label: 'Credit / Debit Card' },
      { code: 'gcash', label: 'GCash' },
      { code: 'cod', label: 'Cash on Delivery' },
    ],
  };
}

function createPaymentConfirmation(
  status: PaymentConfirmation['status'],
): PaymentConfirmation {
  return {
    id: 'pay_mock_test',
    intentId: 'pi_mock_test',
    status,
    amount: 1000,
    currency: 'PHP',
    paymentMethod: 'card',
    transactionId: status === 'success' ? 'txn_mock_test' : undefined,
    confirmedAtUtc: '2026-06-30T00:01:00.000Z',
  };
}

function createOrderConfirmation() {
  return {
    orderNumber: 'OR-1001',
    paymentStatus: 'paid' as const,
    orderStatus: 'confirmed' as const,
    items: [],
    shippingAddress: {
      recipientName: 'Ada Lovelace',
      mobileNumber: '09171234567',
      addressLine1: '1 Main St',
      postalCode: '1000',
      country: 'Philippines',
    },
    deliveryEstimate: '2-4 business days',
    totalAmount: 1000,
    nextSteps: [],
    placedAt: '2026-06-30T00:02:00.000Z',
  };
}

function createSession(email: string): AuthSession {
  return {
    user: {
      id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
      email,
      fullName: 'Sample User',
      roles: ['customer'],
      permissions: [],
    },
    session: {
      id: 'f48e7a9fc19d4a73b48d4e0720415073',
      createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
      expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
    },
  };
}

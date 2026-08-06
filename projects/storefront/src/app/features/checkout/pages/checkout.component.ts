import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatStepperModule } from '@angular/material/stepper';

import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { CommonModule, ViewportScroller } from '@angular/common';
import { Router } from '@angular/router';
import {
  catchError,
  EMPTY,
  finalize,
  from,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { CheckoutApiService } from '../services/checkout-api.service';
import { PaymentApiService } from '../services/payment-api.service';
import {
  CheckoutStep,
  DynamicField,
  DynamicFormObject,
} from '@orange/core/models';
import { DynamicFormComponent } from '../components/dynamic-form/dynamic-form.component';
import { ShippingStepComponent } from '../components/shipping-step/shipping-step.component';
import { PaymentStepComponent } from '../components/payment-step/payment-step.component';
import { CheckoutStorageService } from '../services/checkout-storage.service';
import { CartFacade } from '../../cart/store/cart.facade';
import { OrderService } from 'src/app/features/orders/services/order.service';
import { SiteService } from '@orange/core/services';
import { AnalyticsService } from '@orange/core/services';
import { Cart } from '@orange/core/models';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@orange/core/auth';
import {
  PaymentConfirmation,
  PaymentIntent,
  PaymentStepValue,
} from '@orange/core/models';
import { OrderConfirmation } from '@orange/core/models';

type CheckoutStepComponent =
  | DynamicFormComponent
  | ShippingStepComponent
  | PaymentStepComponent;

type CheckoutStepValue = Record<string, unknown>;

@Component({
  selector: 'app-checkout',
  imports: [
    MatStepperModule,
    MatAnchor,
    CommonModule,
    MatButtonModule,
    DynamicFormComponent,
    ShippingStepComponent,
    PaymentStepComponent,
    TranslatePipe,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly checkoutApiService = inject(CheckoutApiService);
  private readonly paymentApiService = inject(PaymentApiService);
  private readonly checkoutStorage = inject(CheckoutStorageService);
  private readonly cartFacade = inject(CartFacade);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly siteService = inject(SiteService);
  private readonly analytics = inject(AnalyticsService);
  private readonly injector = inject(Injector);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly authStore = inject(AuthStore);

  @ViewChild('activeStep')
  activeStep?: CheckoutStepComponent;

  readonly steps = signal<CheckoutStep[]>([]);
  readonly currentIndex = signal(0);
  readonly isPlacingOrder = signal(false);
  readonly isCreatingPaymentIntent = signal(false);
  readonly paymentIntent = signal<PaymentIntent | null>(null);
  readonly paymentAmount = signal(0);
  readonly paymentCurrency = signal('');
  readonly paymentConfirmation = signal<PaymentConfirmation | null>(null);
  readonly paymentErrorMessage = signal('');
  readonly checkoutData = this.checkoutStorage.checkoutData;

  readonly currentStep = computed(() => {
    return this.steps()[this.currentIndex()];
  });

  ngOnInit(): void {
    this.checkoutData.set(this.checkoutStorage.getAll());
    this.trackCheckoutStarted();

    this.checkoutApiService.getCheckoutForm().subscribe({
      next: (config) => {
        this.steps.set(this.prepareCheckoutSteps(config.steps));
      },
      error: (error) => {
        console.error('Failed to load checkout form config:', error);
      },
    });
  }

  previous(): void {
    this.saveCurrentStep(false);

    if (this.currentIndex() > 0) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  next(): void {
    const step = this.steps()[this.currentIndex()];
    const value = this.saveCurrentStep(true);

    if (!step || !value) return;

    const isLastStep = this.currentIndex() === this.steps().length - 1;

    if (isLastStep) {
      if (step.id === 'payment') {
        this.confirmPaymentAndPlaceOrder(this.toPaymentStepValue(value));
      } else {
        this.placeOrder();
      }
      return;
    }

    const nextIndex = this.currentIndex() + 1;

    this.currentIndex.set(nextIndex);
    this.prepareStep(this.steps()[nextIndex]);
    this.scrollToTopAfterRender();
  }

  onStepValueChanged(stepId: string, value: CheckoutStepValue): void {
    this.saveStepData(stepId, value);

    if (stepId === 'shipping') {
      this.resetPaymentSession();
      this.updateCartShipping(this.readString(value, 'shippingMethod'));
    }

    if (stepId === 'payment') {
      this.paymentConfirmation.set(null);
      this.paymentErrorMessage.set('');
    }
  }

  private updateCartShipping(shippingMethodCode: string): void {
    const postalCode = this.getPostalCode();

    if (!postalCode || !shippingMethodCode) return;

    this.cartFacade.updateShipping(postalCode, shippingMethodCode);
  }

  getPostalCode(): string {
    const data = this.checkoutStorage.getAll();
    const customer = this.asRecord(data['customer']);
    const deliveryAddress = this.asRecord(customer['deliveryAddress']);
    const shippingAddress = this.asRecord(customer['shippingAddress']);

    return (
      this.readString(deliveryAddress, 'postalCode') ||
      this.readString(shippingAddress, 'postalCode')
    );
  }

  getDynamicFormInitialValue(stepId: string): DynamicFormObject | null {
    const value = this.checkoutData()[stepId];
    const initialValue = this.isDynamicFormObject(value) ? value : null;

    if (stepId !== 'customer') {
      return initialValue;
    }

    const email = this.getAuthenticatedUserEmail();

    if (!email) {
      return initialValue;
    }

    return {
      ...(initialValue ?? {}),
      email,
    };
  }

  private saveCurrentStep(validate: boolean): CheckoutStepValue | null {
    const step = this.steps()[this.currentIndex()];
    const component = this.activeStep;

    if (!step || !component) return null;

    if (validate) {
      const value = component.validateAndGetValue();

      if (!value) return null;

      this.saveStepData(step.id, value);
      return value;
    }

    const value = component.getValue();
    this.saveStepData(step.id, value);

    return value;
  }

  private placeOrder(): void {
    if (this.isPlacingOrder()) {
      return;
    }

    this.isPlacingOrder.set(true);
    let checkoutCart: Cart | null = null;

    this.cartFacade.cart$
      .pipe(
        take(1),
        tap((cart) => {
          checkoutCart = cart;
        }),
        switchMap((cart) => this.submitOrder(cart)),
        tap((order) => {
          this.analytics.trackPurchase(order);
          this.checkoutStorage.clear();
          this.cartFacade.clearCart();
        }),
        switchMap((order) =>
          from(
            this.router.navigate([
              '/',
              this.siteService.getCurrentSite(),
              'orders',
              'confirmation',
              order.orderNumber || order.id,
            ]),
          ),
        ),
        catchError((error) => {
          console.error('Failed to place order:', error);
          this.analytics.trackPaymentFailure(
            checkoutCart,
            this.getPaymentFailureReason(error),
          );
          this.isPlacingOrder.set(false);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  private confirmPaymentAndPlaceOrder(paymentValue: PaymentStepValue): void {
    if (this.isPlacingOrder()) {
      return;
    }

    this.isPlacingOrder.set(true);
    this.paymentErrorMessage.set('');
    let checkoutCart: Cart | null = null;

    this.cartFacade.cart$
      .pipe(
        take(1),
        tap((cart) => {
          checkoutCart = cart;
        }),
        switchMap((cart) =>
          this.ensurePaymentIntent(cart).pipe(
            switchMap((intent) =>
              this.paymentApiService.confirmPayment({
                intentId: intent.id,
                paymentMethod: paymentValue.paymentMethod,
                paymentDetails: paymentValue,
              }),
            ),
            switchMap((payment) => {
              this.paymentConfirmation.set(payment);

              if (payment.status === 'failed') {
                this.analytics.trackPaymentFailure(
                  cart,
                  payment.failureReason ?? 'Payment authorization failed',
                );
                this.paymentErrorMessage.set(
                  payment.failureReason ?? 'Payment could not be completed',
                );
                this.isPlacingOrder.set(false);
                return EMPTY;
              }

              return this.submitOrder(cart, payment);
            }),
          ),
        ),
        tap((order) => {
          this.analytics.trackPurchase(order);
          this.checkoutStorage.clear();
          this.cartFacade.clearCart();
        }),
        switchMap((order) =>
          from(
            this.router.navigate([
              '/',
              this.siteService.getCurrentSite(),
              'orders',
              'confirmation',
              order.orderNumber || order.id,
            ]),
          ),
        ),
        catchError((error) => {
          console.error('Failed to confirm payment:', error);
          this.analytics.trackPaymentFailure(
            checkoutCart,
            this.getPaymentFailureReason(error),
          );
          this.paymentErrorMessage.set(this.getPaymentFailureReason(error));
          this.isPlacingOrder.set(false);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  private submitOrder(
    cart: Cart | null,
    payment?: PaymentConfirmation,
  ): Observable<OrderConfirmation> {
    return this.orderService.placeOrder({
      checkoutData: this.getCheckoutDataForOrder(payment),
      cart,
    });
  }

  private trackCheckoutStarted(): void {
    this.cartFacade.cart$.pipe(take(1)).subscribe((cart) => {
      this.analytics.trackCheckoutStarted(cart);
    });
  }

  private saveStepData(stepId: string, value: CheckoutStepValue): void {
    this.checkoutStorage.saveStep(stepId, value);
  }

  private prepareStep(step: CheckoutStep | undefined): void {
    if (step?.id !== 'payment') {
      return;
    }

    this.createPaymentIntent();
  }

  private createPaymentIntent(): void {
    if (this.isCreatingPaymentIntent()) {
      return;
    }

    this.cartFacade.cart$
      .pipe(
        take(1),
        switchMap((cart) => this.createPaymentIntentForCart(cart)),
        catchError((error) => {
          console.error('Failed to create payment intent:', error);
          this.paymentErrorMessage.set(this.getPaymentFailureReason(error));
          this.paymentIntent.set(null);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  private ensurePaymentIntent(cart: Cart | null): Observable<PaymentIntent> {
    const currentIntent = this.paymentIntent();
    const amount = this.getCartTotal(cart);
    const currency = this.siteService.currency();

    if (
      currentIntent &&
      currentIntent.amount === amount &&
      currentIntent.currency === currency
    ) {
      return of(currentIntent);
    }

    return this.createPaymentIntentForCart(cart);
  }

  private createPaymentIntentForCart(
    cart: Cart | null,
  ): Observable<PaymentIntent> {
    const amount = this.getCartTotal(cart);
    const currency = this.siteService.currency();

    this.paymentAmount.set(amount);
    this.paymentCurrency.set(currency);
    this.isCreatingPaymentIntent.set(true);
    this.paymentErrorMessage.set('');
    this.paymentConfirmation.set(null);

    return this.paymentApiService
      .createIntent({
        amount,
        currency,
        cartCode: cart?.code,
        customerEmail: this.getCheckoutCustomerEmail(),
        checkoutData: this.checkoutData(),
        paymentMethods: this.getPaymentMethodCodes(),
      })
      .pipe(
        tap((intent) => {
          this.paymentIntent.set(intent);
        }),
        finalize(() => {
          this.isCreatingPaymentIntent.set(false);
        }),
      );
  }

  private resetPaymentSession(): void {
    this.paymentIntent.set(null);
    this.paymentAmount.set(0);
    this.paymentCurrency.set('');
    this.paymentConfirmation.set(null);
    this.paymentErrorMessage.set('');
  }

  private getCheckoutDataForOrder(
    payment?: PaymentConfirmation,
  ): Record<string, Record<string, unknown>> {
    const checkoutData = this.checkoutData();

    if (!payment) {
      return checkoutData;
    }

    return {
      ...checkoutData,
      payment: {
        ...(checkoutData['payment'] ?? {}),
        paymentIntentId: payment.intentId,
        paymentStatus: payment.status,
        paymentTransactionId: payment.transactionId ?? null,
        paymentFailureReason: payment.failureReason ?? null,
        paymentNextAction: payment.nextAction ?? null,
      },
    };
  }

  private getCartTotal(cart: Cart | null): number {
    const summaryTotal = cart?.cartSummary.find(
      (item) => item.name.toLowerCase() === 'total',
    )?.amount;

    if (typeof summaryTotal === 'number') {
      return summaryTotal;
    }

    return (
      cart?.entries.reduce((total, item) => total + item.totalPrice, 0) ?? 0
    );
  }

  private getCheckoutCustomerEmail(): string {
    const customer = this.asRecord(this.checkoutData()['customer']);

    return (
      this.readString(customer, 'email') ||
      this.readString(this.asRecord(customer['deliveryAddress']), 'deliveryEmail')
    );
  }

  private getPaymentMethodCodes(): string[] {
    const paymentStep = this.steps().find((step) => step.id === 'payment');
    const paymentField = paymentStep?.fields?.find(
      (field) => field.name === 'paymentMethod',
    );

    return paymentField?.options?.map((option) => option.value) ?? [];
  }

  private scrollToTopAfterRender(): void {
    afterNextRender(
      () => {
        this.viewportScroller.scrollToPosition([0, 0]);
      },
      { injector: this.injector },
    );
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private readString(record: Record<string, unknown>, key: string): string {
    const value = record[key];

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return '';
  }

  private isDynamicFormObject(value: unknown): value is DynamicFormObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private prepareCheckoutSteps(steps: CheckoutStep[]): CheckoutStep[] {
    return this.applyAuthenticatedCustomerEmail(steps);
  }

  private applyAuthenticatedCustomerEmail(
    steps: CheckoutStep[],
  ): CheckoutStep[] {
    const email = this.getAuthenticatedUserEmail();

    if (!email) {
      return steps;
    }

    return steps.map((step) => {
      if (step.id !== 'customer' || !step.fields) {
        return step;
      }

      return {
        ...step,
        fields: this.applyAuthenticatedEmailField(step.fields, email),
      };
    });
  }

  private applyAuthenticatedEmailField(
    fields: DynamicField[],
    email: string,
  ): DynamicField[] {
    return fields.map((field) => {
      if (field.name !== 'email' || field.type !== 'email') {
        return field;
      }

      return {
        ...field,
        defaultValue: email,
        disabled: true,
      };
    });
  }

  private getAuthenticatedUserEmail(): string {
    return this.authStore.getSessionSnapshot()?.user.email.trim() ?? '';
  }

  private toPaymentStepValue(value: CheckoutStepValue): PaymentStepValue {
    return {
      paymentMethod: this.readString(value, 'paymentMethod'),
      cardholderName: this.readString(value, 'cardholderName') || undefined,
      cardLast4: this.readString(value, 'cardLast4') || undefined,
      expiryDate: this.readString(value, 'expiryDate') || undefined,
      walletMobileNumber:
        this.readString(value, 'walletMobileNumber') || undefined,
      installmentPlan: this.readString(value, 'installmentPlan') || undefined,
      savePaymentMethod:
        typeof value['savePaymentMethod'] === 'boolean'
          ? value['savePaymentMethod']
          : undefined,
      termsAccepted:
        typeof value['termsAccepted'] === 'boolean'
          ? value['termsAccepted']
          : undefined,
    };
  }

  private getPaymentFailureReason(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'Payment could not be completed';
  }
}

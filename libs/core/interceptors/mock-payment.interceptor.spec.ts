import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  PaymentConfirmation,
  PaymentIntent,
} from '@orange/core/models';
import { MockPaymentInterceptor } from './mock-payment.interceptor';

describe('MockPaymentInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockPaymentInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
  });

  it('creates and confirms a successful payment intent', async () => {
    const intent = await firstValueFrom(
      http.post<PaymentIntent>('/api/payments/intents', {
        amount: 1499,
        currency: 'PHP',
        paymentMethods: ['card'],
      }),
    );

    const confirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/payments/confirm', {
        intentId: intent.id,
        paymentMethod: 'card',
        paymentDetails: {
          paymentMethod: 'card',
          cardLast4: '4242',
        },
      }),
    );

    expect(intent).toEqual(
      expect.objectContaining({
        amount: 1499,
        currency: 'PHP',
        status: 'requires_confirmation',
      }),
    );
    expect(confirmation).toEqual(
      expect.objectContaining({
        intentId: intent.id,
        status: 'success',
        paymentMethod: 'card',
      }),
    );
  });

  it('can return failed and pending confirmations', async () => {
    const failedIntent = await firstValueFrom(
      http.post<PaymentIntent>('/api/payments/intents', {
        amount: 999,
        currency: 'PHP',
        paymentMethods: ['card', 'cod'],
      }),
    );

    const failedConfirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/payments/confirm', {
        intentId: failedIntent.id,
        paymentMethod: 'card',
        paymentDetails: {
          paymentMethod: 'card',
          cardLast4: '0000',
        },
      }),
    );

    const pendingIntent = await firstValueFrom(
      http.post<PaymentIntent>('/api/payments/intents', {
        amount: 999,
        currency: 'PHP',
        paymentMethods: ['cod'],
      }),
    );

    const pendingConfirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/payments/confirm', {
        intentId: pendingIntent.id,
        paymentMethod: 'cod',
        paymentDetails: {
          paymentMethod: 'cod',
        },
      }),
    );

    expect(failedConfirmation.status).toBe('failed');
    expect(failedConfirmation.failureReason).toBeTruthy();
    expect(pendingConfirmation.status).toBe('pending');
    expect(pendingConfirmation.nextAction).toBeTruthy();
  });

  it('supports China payment method labels and confirmations', async () => {
    const intent = await firstValueFrom(
      http.post<PaymentIntent>('/api/cn/payments/intents', {
        amount: 888,
        currency: 'CNY',
        paymentMethods: ['unionpay', 'alipay', 'wechat-pay'],
      }),
    );

    const confirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/cn/payments/confirm', {
        intentId: intent.id,
        paymentMethod: 'alipay',
        paymentDetails: {
          paymentMethod: 'alipay',
        },
      }),
    );

    expect(intent.paymentMethods).toEqual([
      { code: 'unionpay', label: '银行卡 / 银联' },
      { code: 'alipay', label: '支付宝' },
      { code: 'wechat-pay', label: '微信支付' },
    ]);
    expect(confirmation).toEqual(
      expect.objectContaining({
        status: 'success',
        currency: 'CNY',
        paymentMethod: 'alipay',
      }),
    );
  });

  it('supports Japan payment method labels and pending konbini confirmations', async () => {
    const intent = await firstValueFrom(
      http.post<PaymentIntent>('/api/jp/payments/intents', {
        amount: 12000,
        currency: 'JPY',
        paymentMethods: ['card', 'konbini', 'cod'],
      }),
    );

    const confirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/jp/payments/confirm', {
        intentId: intent.id,
        paymentMethod: 'konbini',
        paymentDetails: {
          paymentMethod: 'konbini',
        },
      }),
    );

    expect(intent.paymentMethods).toEqual([
      { code: 'card', label: 'クレジット / デビットカード' },
      { code: 'konbini', label: 'コンビニ払い' },
      { code: 'cod', label: '代金引換' },
    ]);
    expect(confirmation).toEqual(
      expect.objectContaining({
        status: 'pending',
        currency: 'JPY',
        paymentMethod: 'konbini',
      }),
    );
    expect(confirmation.nextAction).toContain('convenience store');
  });

  it('supports France payment method labels and bank transfer confirmations', async () => {
    const intent = await firstValueFrom(
      http.post<PaymentIntent>('/api/fr/payments/intents', {
        amount: 899,
        currency: 'EUR',
        paymentMethods: ['card', 'paypal', 'bank-transfer'],
      }),
    );

    const paypalConfirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/fr/payments/confirm', {
        intentId: intent.id,
        paymentMethod: 'paypal',
        paymentDetails: {
          paymentMethod: 'paypal',
        },
      }),
    );

    const transferConfirmation = await firstValueFrom(
      http.post<PaymentConfirmation>('/api/fr/payments/confirm', {
        intentId: intent.id,
        paymentMethod: 'bank-transfer',
        paymentDetails: {
          paymentMethod: 'bank-transfer',
        },
      }),
    );

    expect(intent.paymentMethods).toEqual([
      { code: 'card', label: 'Carte bancaire' },
      { code: 'paypal', label: 'PayPal' },
      { code: 'bank-transfer', label: 'Virement bancaire' },
    ]);
    expect(paypalConfirmation).toEqual(
      expect.objectContaining({
        status: 'success',
        currency: 'EUR',
        paymentMethod: 'paypal',
      }),
    );
    expect(transferConfirmation).toEqual(
      expect.objectContaining({
        status: 'pending',
        currency: 'EUR',
        paymentMethod: 'bank-transfer',
      }),
    );
    expect(transferConfirmation.nextAction).toContain('bank transfer');
  });
});

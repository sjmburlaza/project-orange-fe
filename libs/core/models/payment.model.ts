export type PaymentConfirmationStatus = 'success' | 'failed' | 'pending';

export interface PaymentStepValue {
  [key: string]: unknown;
  paymentMethod: string;
  cardholderName?: string;
  cardLast4?: string;
  expiryDate?: string;
  walletMobileNumber?: string;
  installmentPlan?: string;
  savePaymentMethod?: boolean;
  termsAccepted?: boolean;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  cartCode?: string;
  customerEmail?: string;
  checkoutData?: Record<string, Record<string, unknown>>;
  paymentMethods: string[];
}

export interface PaymentIntentMethod {
  code: string;
  label: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_confirmation';
  createdAtUtc: string;
  expiresAtUtc: string;
  paymentMethods: PaymentIntentMethod[];
}

export interface ConfirmPaymentRequest {
  intentId: string;
  paymentMethod: string;
  paymentDetails: PaymentStepValue;
}

export interface PaymentConfirmation {
  id: string;
  intentId: string;
  status: PaymentConfirmationStatus;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  failureReason?: string;
  nextAction?: string;
  confirmedAtUtc: string;
}

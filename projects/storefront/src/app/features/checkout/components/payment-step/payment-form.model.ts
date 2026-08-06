import { FormControl, FormGroup } from '@angular/forms';
import { PaymentStepValue } from '@orange/core/models';

export interface PaymentShellFormControls {
  paymentMethod: FormControl<string>;
  termsAccepted: FormControl<boolean>;
}

export type PaymentShellFormGroup = FormGroup<PaymentShellFormControls>;

export interface CardPaymentFormControls {
  cardholderName: FormControl<string>;
  cardNumber: FormControl<string>;
  expiryDate: FormControl<string>;
  securityCode: FormControl<string>;
  installmentPlan: FormControl<string>;
  savePaymentMethod: FormControl<boolean>;
}

export type CardPaymentFormGroup = FormGroup<CardPaymentFormControls>;

export interface WalletPaymentFormControls {
  walletMobileNumber: FormControl<string>;
}

export type WalletPaymentFormGroup = FormGroup<WalletPaymentFormControls>;

export interface PaymentMethodFormComponent {
  validateAndGetValue(): Partial<PaymentStepValue> | null;
  getValue(): Partial<PaymentStepValue>;
}

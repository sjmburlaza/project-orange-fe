import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PaymentStepValue } from '@orange/core/models';
import { PaymentMethodFormComponent } from '../payment-form.model';
import { CardPaymentMethodComponent } from '../card-payment-method/card-payment-method.component';

@Component({
  selector: 'app-unionpay-payment-method',
  imports: [CardPaymentMethodComponent],
  templateUrl: './unionpay-payment-method.component.html',
  styleUrl: './unionpay-payment-method.component.scss',
})
export class UnionpayPaymentMethodComponent
  implements PaymentMethodFormComponent
{
  @ViewChild(CardPaymentMethodComponent)
  private cardMethod?: CardPaymentMethodComponent;

  @Input() initialValue: Partial<PaymentStepValue> = {};

  @Output() valueChanged = new EventEmitter<Partial<PaymentStepValue>>();

  readonly acceptedPayments = ['UnionPay'];

  validateAndGetValue(): Partial<PaymentStepValue> | null {
    return this.cardMethod?.validateAndGetValue() ?? null;
  }

  getValue(): Partial<PaymentStepValue> {
    return this.cardMethod?.getValue() ?? {};
  }
}

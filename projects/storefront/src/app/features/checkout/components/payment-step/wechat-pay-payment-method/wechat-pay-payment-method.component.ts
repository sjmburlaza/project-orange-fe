import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStepValue } from '@orange/core/models';
import { PaymentMethodFormComponent } from '../payment-form.model';

@Component({
  selector: 'app-wechat-pay-payment-method',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './wechat-pay-payment-method.component.html',
  styleUrl: './wechat-pay-payment-method.component.scss',
})
export class WechatPayPaymentMethodComponent
  implements PaymentMethodFormComponent
{
  validateAndGetValue(): Partial<PaymentStepValue> {
    return this.getValue();
  }

  getValue(): Partial<PaymentStepValue> {
    return {};
  }
}

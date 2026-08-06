import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStepValue } from '@orange/core/models';
import { PaymentMethodFormComponent } from '../payment-form.model';

@Component({
  selector: 'app-alipay-payment-method',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './alipay-payment-method.component.html',
  styleUrl: './alipay-payment-method.component.scss',
})
export class AlipayPaymentMethodComponent implements PaymentMethodFormComponent {
  validateAndGetValue(): Partial<PaymentStepValue> {
    return this.getValue();
  }

  getValue(): Partial<PaymentStepValue> {
    return {};
  }
}

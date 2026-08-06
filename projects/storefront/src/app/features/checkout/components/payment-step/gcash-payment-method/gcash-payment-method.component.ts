import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStepValue } from '@orange/core/models';
import { GCASH_MOBILE_NUMBER_PATTERN } from '@orange/shared/constants';
import {
  PaymentMethodFormComponent,
  WalletPaymentFormGroup,
} from '../payment-form.model';

@Component({
  selector: 'app-gcash-payment-method',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './gcash-payment-method.component.html',
  styleUrl: './gcash-payment-method.component.scss',
})
export class GcashPaymentMethodComponent
  implements OnInit, OnChanges, PaymentMethodFormComponent
{
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input() initialValue: Partial<PaymentStepValue> = {};

  @Output() valueChanged = new EventEmitter<Partial<PaymentStepValue>>();

  readonly form: WalletPaymentFormGroup = this.fb.nonNullable.group({
    walletMobileNumber: [
      '',
      [Validators.required, Validators.pattern(GCASH_MOBILE_NUMBER_PATTERN)],
    ],
  });

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.valueChanged.emit(this.getValue());
      });
  }

  ngOnChanges(): void {
    this.form.patchValue(
      {
        walletMobileNumber: this.initialValue.walletMobileNumber ?? '',
      },
      { emitEvent: false },
    );
  }

  validateAndGetValue(): Partial<PaymentStepValue> | null {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return null;
    }

    return this.getValue();
  }

  getValue(): Partial<PaymentStepValue> {
    return {
      walletMobileNumber: this.form.controls.walletMobileNumber.value.trim(),
    };
  }
}

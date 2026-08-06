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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStepValue } from '@orange/core/models';
import { CardExpiryFormatDirective } from '@orange/shared/directives';
import { CardNumberSpacingDirective } from '@orange/shared/directives';
import {
  CARD_EXPIRY_DATE_PATTERN,
  CARD_NUMBER_PATTERN,
  CARD_SECURITY_CODE_PATTERN,
  NON_DIGIT_PATTERN,
} from '@orange/shared/constants';
import {
  CardPaymentFormGroup,
  PaymentMethodFormComponent,
} from '../payment-form.model';

@Component({
  selector: 'app-card-payment-method',
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    CardExpiryFormatDirective,
    CardNumberSpacingDirective,
  ],
  templateUrl: './card-payment-method.component.html',
  styleUrl: './card-payment-method.component.scss',
})
export class CardPaymentMethodComponent
  implements OnInit, OnChanges, PaymentMethodFormComponent
{
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input() initialValue: Partial<PaymentStepValue> = {};
  @Input() acceptedPayments = ['Visa', 'Mastercard', 'AMEX'];

  @Output() valueChanged = new EventEmitter<Partial<PaymentStepValue>>();

  readonly installments = [
    {
      value: 'full',
      labelKey: 'checkout.payment.card.installments.full',
    },
    {
      value: 'three_months',
      labelKey: 'checkout.payment.card.installments.threeMonths',
    },
    {
      value: 'six_months',
      labelKey: 'checkout.payment.card.installments.sixMonths',
    },
  ];

  readonly form: CardPaymentFormGroup = this.fb.nonNullable.group({
    cardholderName: ['', [Validators.required]],
    cardNumber: [
      '',
      [Validators.required, Validators.pattern(CARD_NUMBER_PATTERN)],
    ],
    expiryDate: [
      '',
      [Validators.required, Validators.pattern(CARD_EXPIRY_DATE_PATTERN)],
    ],
    securityCode: [
      '',
      [Validators.required, Validators.pattern(CARD_SECURITY_CODE_PATTERN)],
    ],
    installmentPlan: ['full'],
    savePaymentMethod: [false],
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
        cardholderName: this.initialValue.cardholderName ?? '',
        expiryDate: this.initialValue.expiryDate ?? '',
        installmentPlan: this.initialValue.installmentPlan ?? 'full',
        savePaymentMethod: this.initialValue.savePaymentMethod ?? false,
      },
      { emitEvent: false },
    );
  }

  selectInstallment(value: string): void {
    this.form.controls.installmentPlan.setValue(value);
  }

  validateAndGetValue(): Partial<PaymentStepValue> | null {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return null;
    }

    return this.getValue({ trimCardholderName: true });
  }

  getValue(
    options: { trimCardholderName?: boolean } = {},
  ): Partial<PaymentStepValue> {
    const value = this.form.getRawValue();
    const cardNumber = this.getDigits(value.cardNumber);
    const cardholderName = options.trimCardholderName
      ? value.cardholderName.trim()
      : value.cardholderName;

    return {
      cardholderName,
      cardLast4: cardNumber.slice(-4),
      expiryDate: value.expiryDate.trim(),
      installmentPlan: value.installmentPlan,
      savePaymentMethod: value.savePaymentMethod,
    };
  }

  private getDigits(value: string): string {
    return value.replace(NON_DIGIT_PATTERN, '');
  }
}

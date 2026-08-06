import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { DynamicField, Option } from '@orange/core/models';
import { TranslatePipe } from '@ngx-translate/core';
import {
  PaymentConfirmation,
  PaymentIntent,
  PaymentStepValue,
} from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import {
  PaymentMethodFormComponent,
  PaymentShellFormGroup,
} from './payment-form.model';
import { CardPaymentMethodComponent } from './card-payment-method/card-payment-method.component';
import { CodPaymentMethodComponent } from './cod-payment-method/cod-payment-method.component';
import { GcashPaymentMethodComponent } from './gcash-payment-method/gcash-payment-method.component';
import { AlipayPaymentMethodComponent } from './alipay-payment-method/alipay-payment-method.component';
import { UnionpayPaymentMethodComponent } from './unionpay-payment-method/unionpay-payment-method.component';
import { WechatPayPaymentMethodComponent } from './wechat-pay-payment-method/wechat-pay-payment-method.component';

interface PaymentMethodOptionView extends Option {
  detailKey: string;
  showInstructionPanel: boolean;
}

@Component({
  selector: 'app-payment-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatIconModule,
    TranslatePipe,
    CardPaymentMethodComponent,
    CodPaymentMethodComponent,
    GcashPaymentMethodComponent,
    AlipayPaymentMethodComponent,
    UnionpayPaymentMethodComponent,
    WechatPayPaymentMethodComponent,
  ],
  templateUrl: './payment-step.component.html',
  styleUrl: './payment-step.component.scss',
})
export class PaymentStepComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteService = inject(SiteService);
  private readonly smartPaymentMethods = new Set([
    'card',
    'unionpay',
    'gcash',
  ]);
  private readonly customPanelPaymentMethods = new Set([
    'alipay',
    'wechat-pay',
  ]);

  @ViewChild('activeMethod')
  private activeMethod?: PaymentMethodFormComponent;

  @Input({ required: true }) fields: DynamicField[] = [];
  @Input() initialValue: unknown = {};
  @Input() paymentIntent: PaymentIntent | null = null;
  @Input() paymentAmount = 0;
  @Input() paymentCurrency = '';
  @Input() isCreatingPaymentIntent = false;
  @Input() isConfirmingPayment = false;
  @Input() confirmationResult: PaymentConfirmation | null = null;
  @Input() paymentErrorMessage = '';

  @Output() valueChanged = new EventEmitter<PaymentStepValue>();

  readonly currency = this.siteService.currency;
  readonly paymentForm: PaymentShellFormGroup = this.fb.nonNullable.group({
    paymentMethod: ['', [Validators.required]],
    termsAccepted: [false, [Validators.requiredTrue]],
  });
  readonly paymentMethodControl = this.paymentForm.controls.paymentMethod;

  readonly methodContent: Record<string, { detailKey: string }> = {
    card: {
      detailKey: 'checkout.payment.methods.card.detail',
    },
    gcash: {
      detailKey: 'checkout.payment.methods.gcash.detail',
    },
    cod: {
      detailKey: 'checkout.payment.methods.cod.detail',
    },
    konbini: {
      detailKey: 'checkout.payment.methods.konbini.detail',
    },
    paypal: {
      detailKey: 'checkout.payment.methods.paypal.detail',
    },
    'bank-transfer': {
      detailKey: 'checkout.payment.methods.bankTransfer.detail',
    },
    unionpay: {
      detailKey: 'checkout.payment.methods.unionpay.detail',
    },
    alipay: {
      detailKey: 'checkout.payment.methods.alipay.detail',
    },
    'wechat-pay': {
      detailKey: 'checkout.payment.methods.wechatPay.detail',
    },
  };
  paymentOptions: PaymentMethodOptionView[] = [];
  selectedPaymentMethod = '';
  methodValue: Partial<PaymentStepValue> = {};

  ngOnInit(): void {
    this.paymentForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedPaymentMethod = value.paymentMethod ?? '';
        this.valueChanged.emit(this.getValue());
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.paymentOptions = this.createPaymentOptions();
    }

    const value = this.initialValue as Partial<PaymentStepValue>;

    if (changes['initialValue'] && value) {
      this.selectedPaymentMethod = value.paymentMethod ?? '';
      this.paymentForm.patchValue(
        {
          paymentMethod: this.selectedPaymentMethod,
          termsAccepted: value.termsAccepted ?? false,
        },
        {
          emitEvent: false,
        },
      );
      this.methodValue = this.getInitialMethodValue(value);
    }
  }

  selectPayment(value: string): void {
    if (this.paymentMethodControl.value === value) {
      return;
    }

    this.methodValue = {};
    this.selectedPaymentMethod = value;
    this.paymentForm.patchValue(
      {
        paymentMethod: value,
      },
      {
        emitEvent: false,
      },
    );
    this.paymentMethodControl.markAsTouched();
    this.valueChanged.emit(this.getValue());
  }

  collapsePayment(value: string): void {
    if (this.paymentMethodControl.value !== value) {
      return;
    }

    this.methodValue = {};
    this.selectedPaymentMethod = '';
    this.paymentMethodControl.setValue('', { emitEvent: false });
    this.paymentMethodControl.markAsTouched();
    this.valueChanged.emit(this.getValue());
  }

  onMethodValueChanged(value: Partial<PaymentStepValue>): void {
    this.methodValue = value;
    this.valueChanged.emit(this.getValue());
  }

  validateAndGetValue(): PaymentStepValue | null {
    this.paymentForm.markAllAsTouched();
    const methodValue = this.validateMethodValue();

    if (this.paymentForm.invalid || methodValue === null) {
      return null;
    }

    return this.buildValue(methodValue);
  }

  getValue(): PaymentStepValue {
    if (!this.requiresSmartMethodValidation(this.selectedPaymentMethod)) {
      return this.buildValue(this.methodValue);
    }

    return this.buildValue(this.activeMethod?.getValue() ?? this.methodValue);
  }

  private validateMethodValue(): Partial<PaymentStepValue> | null {
    if (!this.requiresSmartMethodValidation(this.selectedPaymentMethod)) {
      return {};
    }

    return this.activeMethod?.validateAndGetValue() ?? null;
  }

  private buildValue(methodValue: Partial<PaymentStepValue>): PaymentStepValue {
    const value = this.paymentForm.getRawValue();

    return {
      paymentMethod: value.paymentMethod,
      termsAccepted: value.termsAccepted,
      ...methodValue,
    };
  }

  private getInitialMethodValue(
    value: Partial<PaymentStepValue>,
  ): Partial<PaymentStepValue> {
    const methodValue: Partial<PaymentStepValue> = {};

    if (value.cardholderName) {
      methodValue.cardholderName = value.cardholderName;
    }

    if (value.cardLast4) {
      methodValue.cardLast4 = value.cardLast4;
    }

    if (value.expiryDate) {
      methodValue.expiryDate = value.expiryDate;
    }

    if (value.walletMobileNumber) {
      methodValue.walletMobileNumber = value.walletMobileNumber;
    }

    if (value.installmentPlan) {
      methodValue.installmentPlan = value.installmentPlan;
    }

    if (typeof value.savePaymentMethod === 'boolean') {
      methodValue.savePaymentMethod = value.savePaymentMethod;
    }

    return methodValue;
  }

  private createPaymentOptions(): PaymentMethodOptionView[] {
    const paymentField = this.fields.find(
      (field) => field.name === 'paymentMethod',
    );

    return (paymentField?.options ?? []).map((option) => ({
      ...option,
      detailKey:
        this.methodContent[option.value]?.detailKey ??
        'checkout.payment.methods.default',
      showInstructionPanel: this.shouldShowInstructionPanel(option.value),
    }));
  }

  private shouldShowInstructionPanel(value: string): boolean {
    return (
      !this.smartPaymentMethods.has(value) &&
      !this.customPanelPaymentMethods.has(value)
    );
  }

  private requiresSmartMethodValidation(method: string): boolean {
    return this.smartPaymentMethods.has(method);
  }
}

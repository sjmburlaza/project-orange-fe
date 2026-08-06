import { CommonModule, CurrencyPipe } from '@angular/common';
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
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DynamicField } from '@orange/core/models';
import {
  FulfillmentService,
  FulfillmentOption,
  FulfillmentType,
} from '../../services/fulfillment.service';
import { SiteService } from '@orange/core/services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-shipping-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './shipping-step.component.html',
  styleUrl: './shipping-step.component.scss',
})
export class ShippingStepComponent implements OnInit, OnChanges {
  private readonly fulfillmentService = inject(FulfillmentService);
  private readonly destroyRef = inject(DestroyRef);
  readonly siteService = inject(SiteService);
  readonly currency = this.siteService.currency;
  readonly fulfillmentTabs: {
    type: FulfillmentType;
    labelKey: string;
    icon: string;
  }[] = [
    {
      type: 'delivery',
      labelKey: 'checkout.fulfillment.tabs.delivery',
      icon: 'local_shipping',
    },
    {
      type: 'pickup',
      labelKey: 'checkout.fulfillment.tabs.pickup',
      icon: 'storefront',
    },
  ];

  @Input({ required: true }) fields: DynamicField[] = [];
  @Input() initialValue: unknown = {};
  @Input() postalCode = '';

  @Output() valueChanged = new EventEmitter<{ shippingMethod: string }>();

  readonly shippingMethod = new FormControl('', Validators.required);

  fulfillmentOptions: FulfillmentOption[] = [];
  selectedFulfillmentType: FulfillmentType = 'delivery';
  isLoading = false;

  get field(): DynamicField | undefined {
    return this.fields.find((field) => field.name === 'shippingMethod');
  }

  get filteredFulfillmentOptions(): FulfillmentOption[] {
    return this.fulfillmentOptions.filter(
      (option) => option.type === this.selectedFulfillmentType,
    );
  }

  ngOnInit(): void {
    this.shippingMethod.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.valueChanged.emit(this.getValue());
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.syncInitialValue();
    }

    if (changes['postalCode'] && this.postalCode) {
      this.loadFulfillmentOptions(this.postalCode);
    }
  }

  private loadFulfillmentOptions(postalCode: string): void {
    this.isLoading = true;
    this.fulfillmentOptions = [];

    this.fulfillmentService
      .getOptions(postalCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.fulfillmentOptions = options;
          this.syncSelectedFulfillmentType();
          this.isLoading = false;
        },
        error: () => {
          this.fulfillmentOptions = [];
          this.isLoading = false;
        },
      });
  }

  selectFulfillmentType(type: FulfillmentType): void {
    this.selectedFulfillmentType = type;

    const selectedOption = this.fulfillmentOptions.find(
      (option) => option.code === this.shippingMethod.value,
    );

    if (selectedOption && selectedOption.type !== type) {
      this.shippingMethod.setValue('');
      this.shippingMethod.markAsUntouched();
    }
  }

  selectFulfillment(option: FulfillmentOption): void {
    this.shippingMethod.setValue(option.code);
    this.shippingMethod.markAsTouched();
  }

  validateAndGetValue(): { shippingMethod: string } | null {
    this.shippingMethod.markAsTouched();

    if (this.shippingMethod.invalid) {
      return null;
    }

    return this.getValue();
  }

  getValue(): { shippingMethod: string } {
    return {
      shippingMethod: this.shippingMethod.value ?? '',
    };
  }

  private syncInitialValue(): void {
    const value = this.initialValue as {
      shippingMethod?: string;
    };

    if (value?.shippingMethod === this.shippingMethod.value) {
      return;
    }

    this.shippingMethod.setValue(value?.shippingMethod ?? '', {
      emitEvent: false,
    });

    if (this.fulfillmentOptions.length) {
      this.syncSelectedFulfillmentType();
    }
  }

  private syncSelectedFulfillmentType(): void {
    const selectedCode = this.shippingMethod.value;

    if (!selectedCode) {
      this.selectedFulfillmentType = 'delivery';
      return;
    }

    const selectedOption = this.fulfillmentOptions.find(
      (option) => option.code === selectedCode,
    );

    if (selectedOption) {
      this.selectedFulfillmentType = selectedOption.type;
      return;
    }

    this.selectedFulfillmentType = 'delivery';
    this.shippingMethod.setValue('', { emitEvent: false });
  }
}

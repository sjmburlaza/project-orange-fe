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
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  DynamicField,
  DynamicFormObject,
  DynamicFormValue,
} from '@orange/core/models';
import { DynamicFieldComponent } from '../dynamic-field/dynamic-field.component';
import { ValidatorMapperService } from '../../services/validator-mapper.service';
import { AsyncValidatorMapperService } from '../../services/async-validator-mapper.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dynamic-form',
  imports: [
    ReactiveFormsModule,
    DynamicFieldComponent,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
})
export class DynamicFormComponent implements OnInit, OnChanges {
  private readonly validatorService = inject(ValidatorMapperService);
  private readonly asyncValidatorService = inject(AsyncValidatorMapperService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) fields!: DynamicField[];
  @Input() initialValue: DynamicFormObject | null = null;

  @Output() submitForm = new EventEmitter<DynamicFormObject>();

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.buildForm(this.fields);
    this.patchInitialValue();
    this.setupVisibilityLogic(this.fields, this.form);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.form) {
      this.patchInitialValue();
      this.setupVisibilityLogic(this.fields, this.form);
    }
  }

  onSubmit(): void {
    this.setupVisibilityLogic(this.fields, this.form);

    if (this.form.valid) {
      this.submitForm.emit(this.form.getRawValue());
    } else {
      this.form.markAllAsTouched();
    }
  }

  getValue(): DynamicFormObject {
    return this.getNormalizedValue();
  }

  validateAndGetValue(): DynamicFormObject | null {
    this.setupVisibilityLogic(this.fields, this.form);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return null;
    }

    return this.getNormalizedValue();
  }

  isValid(): boolean {
    this.setupVisibilityLogic(this.fields, this.form);
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  buildForm(fields: DynamicField[]): FormGroup {
    const group: Record<string, AbstractControl> = {};

    fields?.forEach((f) => {
      const validators = this.validatorService.getValidators(
        f.validators || [],
      );

      const asyncValidators = (f.asyncValidators || [])
        .map((v) => this.asyncValidatorService.getValidator(v.name))
        .filter(
          (validator): validator is AsyncValidatorFn => validator !== null,
        );

      switch (f.type) {
        case 'group':
          group[f.name] = this.buildForm(f.fields || []);
          break;

        case 'array': {
          const formArray = new FormArray<FormGroup>([]);

          if (f.fields) {
            formArray.push(this.buildForm(f.fields));
          }

          group[f.name] = formArray;
          break;
        }

        default:
          group[f.name] = new FormControl<DynamicFormValue>(
            {
              value: f.defaultValue ?? null,
              disabled: f.disabled === true,
            },
            {
              validators,
              asyncValidators,
              updateOn: f.type === 'checkbox' ? 'change' : 'blur',
            },
          );
      }
    });

    return new FormGroup(group);
  }

  getGridClass(field: DynamicField) {
    const mobile = field.grid?.mobile ?? 12;
    const tablet = field.grid?.tablet ?? mobile;
    const desktop = field.grid?.desktop ?? 6;

    return `col-${mobile} col-md-${tablet} col-lg-${desktop}`;
  }

  private patchInitialValue(): void {
    if (this.initialValue) {
      this.form.patchValue(this.initialValue);
    }
  }

  private setupVisibilityLogic(fields: DynamicField[], form: FormGroup): void {
    fields.forEach((field) => {
      if (field.type === 'group' && field.fields?.length) {
        const childGroup = form.get(field.name);

        if (childGroup instanceof FormGroup) {
          this.setupVisibilityLogic(field.fields, childGroup);
        }

        return;
      }

      if (!field.visibleIf) {
        return;
      }

      const control = form.get(field.name);
      const dependentControl = form.get(field.visibleIf.field);

      if (!control || !dependentControl) {
        return;
      }

      this.applyVisibility(
        control,
        dependentControl.value === field.visibleIf.value,
        field.disabled === true,
      );

      dependentControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => {
          this.applyVisibility(
            control,
            value === field.visibleIf?.value,
            field.disabled === true,
          );
        });
    });
  }

  private applyVisibility(
    control: AbstractControl,
    visible: boolean,
    disabled = false,
  ): void {
    if (visible && !disabled) {
      control.enable({ emitEvent: false });
      return;
    }

    if (visible) {
      control.disable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
      control.reset(null, { emitEvent: false });
    }
  }

  private getNormalizedValue(): DynamicFormObject {
    const value = this.form.getRawValue() as DynamicFormObject;

    const deliveryAddress = value['deliveryAddress'];
    const billingAddress = value['billingAddress'];

    if (
      !this.isFormObject(deliveryAddress) ||
      !this.isFormObject(billingAddress)
    ) {
      return value;
    }

    const sameAsDeliveryAddress =
      billingAddress['sameAsDeliveryAddress'] === true;

    if (!sameAsDeliveryAddress) {
      return value;
    }

    const billingField = this.fields.find(
      (field) => field.name === 'billingAddress',
    );

    const billingFields = billingField?.fields ?? [];

    const normalizedBillingAddress = billingFields.reduce<DynamicFormObject>(
      (acc, field) => {
        if (field.name === 'sameAsDeliveryAddress') {
          acc[field.name] = true;
          return acc;
        }

        if (field.name in value) {
          acc[field.name] = value[field.name];
          return acc;
        }

        if (field.name in deliveryAddress) {
          acc[field.name] = deliveryAddress[field.name];
          return acc;
        }

        acc[field.name] = billingAddress[field.name] ?? null;

        return acc;
      },
      {},
    );

    return {
      ...value,
      billingAddress: normalizedBillingAddress,
    };
  }

  private isFormObject(value: DynamicFormValue): value is DynamicFormObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

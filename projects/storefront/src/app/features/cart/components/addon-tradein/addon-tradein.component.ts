import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { distinctUntilChanged, filter, take } from 'rxjs';
import {
  TradeInBrand,
  TradeInCategory,
  TradeInDevice,
  TradeInSession,
  TradeInStepThreeField,
  TradeInStorage,
} from '@orange/core/models';
import { TradeInFacade } from 'src/app/features/trade-in/store/trade-in.facade';
import { AddonDialogData } from '../addon/addon-dialog-data.model';
import { SiteService } from '@orange/core/services';

@Component({
  selector: 'app-addon-tradein',
  imports: [AsyncPipe, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './addon-tradein.component.html',
  styleUrl: './addon-tradein.component.scss',
})
export class AddonTradeinComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddonTradeinComponent>);
  private readonly tradeInFacade = inject(TradeInFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly siteService = inject(SiteService);
  readonly currency = this.siteService.currency;

  readonly data = inject<AddonDialogData>(MAT_DIALOG_DATA);

  readonly config$ = this.tradeInFacade.config$;
  readonly categories$ = this.tradeInFacade.categories$;
  readonly brands$ = this.tradeInFacade.brands$;
  readonly devices$ = this.tradeInFacade.devices$;
  readonly storages$ = this.tradeInFacade.storages$;
  readonly session$ = this.tradeInFacade.currentSession$;
  readonly busy$ = this.tradeInFacade.busy$;
  readonly error$ = this.tradeInFacade.error$;

  readonly stepOneForm = this.fb.nonNullable.group({
    postalCode: ['', [Validators.required]],
    categoryCode: ['', [Validators.required]],
    brandCode: [{ value: '', disabled: true }, [Validators.required]],
    deviceCode: [{ value: '', disabled: true }, [Validators.required]],
    storageCode: [{ value: '', disabled: true }, [Validators.required]],
  });
  readonly stepTwoForm = this.fb.nonNullable.group({
    imei: ['', [Validators.required]],
  });
  readonly conditionForm = this.fb.record<FormControl<string | null>>({});

  activeStep = 1;

  private categories: TradeInCategory[] = [];
  private brands: TradeInBrand[] = [];
  private devices: TradeInDevice[] = [];
  private storages: TradeInStorage[] = [];
  private currentSession: TradeInSession | null = null;

  ngOnInit(): void {
    this.tradeInFacade.reset();
    this.tradeInFacade.loadConfig();
    this.tradeInFacade.loadCategories();
    this.tradeInFacade.createSession({
      productId: this.data.productId,
    });
    this.bindStepOneFormChanges();

    this.categories$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categories = categories;
      });

    this.brands$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((brands) => {
        this.brands = brands;
      });

    this.devices$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((devices) => {
        this.devices = devices;
      });

    this.storages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((storages) => {
        this.storages = storages;
      });

    this.session$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        this.currentSession = session;
        this.hydrateFromSession(session);
      });
  }

  canContinueStepOne(): boolean {
    return Boolean(
      this.currentSession?.sessionId &&
      this.stepOneForm.valid &&
      this.estimateAmount > 0,
    );
  }

  continueFromStepOne(): void {
    const sessionId = this.currentSession?.sessionId;

    if (!sessionId || !this.canContinueStepOne()) return;

    const formValue = this.stepOneForm.getRawValue();

    this.tradeInFacade.updateStepOne(sessionId, {
      formData: {
        postalCode: formValue.postalCode.trim(),
        category: this.selectedCategoryName,
        brand: this.selectedBrandName,
        device: this.selectedDeviceName,
        storage: this.selectedStorageName,
      },
      summary: {
        brand: this.selectedBrandName,
        device: this.selectedDeviceName,
        storage: this.selectedStorageName,
        finalAmount: this.estimateAmount,
      },
    });
    this.activeStep = 2;
  }

  continueFromStepTwo(): void {
    const session = this.currentSession;

    if (!session?.sessionId || this.stepTwoForm.invalid) return;

    const imei = this.stepTwoForm.controls.imei.value.trim();

    this.tradeInFacade.updateStepTwo(session.sessionId, {
      stepTwo: {
        text1: session.stepTwo?.text1 ?? '',
        icon: session.stepTwo?.icon ?? '',
        iconText: session.stepTwo?.iconText ?? '',
        text2: session.stepTwo?.text2 ?? '',
        imei: {
          label: session.stepTwo?.imei.label ?? 'IMEI',
          placeholder: session.stepTwo?.imei.placeholder ?? '',
          value: imei,
        },
      },
    });
    this.activeStep = 3;
  }

  setConditionResponse(code: string, response: string): void {
    this.conditionForm.controls[code]?.setValue(response);
  }

  getConditionResponse(code: string): string | null {
    return this.conditionForm.controls[code]?.value ?? null;
  }

  canContinueStepThree(
    fields: TradeInStepThreeField[] | null | undefined,
  ): boolean {
    if (!fields?.length) {
      return Boolean(this.currentSession?.sessionId);
    }

    return fields.every((field) =>
      Boolean(this.conditionForm.controls[field.code]?.value),
    );
  }

  continueFromStepThree(
    fields: TradeInStepThreeField[] | null | undefined,
  ): void {
    const sessionId = this.currentSession?.sessionId;

    if (!sessionId || !this.canContinueStepThree(fields)) return;

    this.tradeInFacade.updateStepThree(sessionId, {
      stepThree: (fields ?? []).map((field) => ({
        ...field,
        response: this.getConditionResponse(field.code) ?? field.response,
      })),
    });
    this.activeStep = 4;
  }

  confirm(): void {
    const sessionId = this.currentSession?.sessionId;

    if (!sessionId) return;

    this.session$
      .pipe(
        filter((session): session is TradeInSession =>
          Boolean(session?.isConfirmed && session.sessionId === sessionId),
        ),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((session) => {
        this.dialogRef.close({
          tradeInSessionId: session.sessionId,
        });
      });

    this.tradeInFacade.confirmSession(sessionId);
  }

  goBack(): void {
    this.activeStep = Math.max(1, this.activeStep - 1);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get categoryCode(): string {
    return this.stepOneForm.controls.categoryCode.value;
  }

  get brandCode(): string {
    return this.stepOneForm.controls.brandCode.value;
  }

  get deviceCode(): string {
    return this.stepOneForm.controls.deviceCode.value;
  }

  get storageCode(): string {
    return this.stepOneForm.controls.storageCode.value;
  }

  get estimateAmount(): number {
    return (
      (this.selectedBrand?.amount ?? 0) +
      (this.selectedDevice?.amount ?? 0) +
      (this.selectedStorage?.amount ?? 0)
    );
  }

  get selectedCategoryName(): string {
    return (
      this.categories.find((category) => category.code === this.categoryCode)
        ?.name ?? ''
    );
  }

  get selectedBrandName(): string {
    const brand = this.selectedBrand;

    return brand?.name || brand?.brandName || '';
  }

  get selectedDeviceName(): string {
    const device = this.selectedDevice;

    return device?.name || device?.deviceName || '';
  }

  get selectedStorageName(): string {
    const storage = this.selectedStorage;

    return storage?.name || storage?.size || '';
  }

  get selectedBrand(): TradeInBrand | undefined {
    return this.brands.find((brand) => brand.code === this.brandCode);
  }

  get selectedDevice(): TradeInDevice | undefined {
    return this.devices.find((device) => device.code === this.deviceCode);
  }

  get selectedStorage(): TradeInStorage | undefined {
    return this.storages.find((storage) => storage.code === this.storageCode);
  }

  private hydrateFromSession(session: TradeInSession | null): void {
    if (!session) return;

    if (session.formData?.postalCode) {
      this.stepOneForm.patchValue(
        {
          postalCode: session.formData.postalCode,
        },
        { emitEvent: false },
      );
    }

    if (session.stepTwo?.imei.value) {
      this.stepTwoForm.patchValue(
        {
          imei: session.stepTwo.imei.value,
        },
        { emitEvent: false },
      );
    }

    if (session.stepThree?.length) {
      this.ensureConditionControls(session.stepThree);

      session.stepThree.forEach((field) => {
        if (field.response) {
          this.conditionForm.controls[field.code]?.setValue(field.response, {
            emitEvent: false,
          });
        }
      });
    }
  }

  private bindStepOneFormChanges(): void {
    const { categoryCode, brandCode, deviceCode, storageCode } =
      this.stepOneForm.controls;

    categoryCode.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        brandCode.reset('', { emitEvent: false });
        deviceCode.reset('', { emitEvent: false });
        storageCode.reset('', { emitEvent: false });
        deviceCode.disable({ emitEvent: false });
        storageCode.disable({ emitEvent: false });

        if (value) {
          brandCode.enable({ emitEvent: false });
          this.tradeInFacade.loadBrands(value);
        } else {
          brandCode.disable({ emitEvent: false });
        }
      });

    brandCode.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        deviceCode.reset('', { emitEvent: false });
        storageCode.reset('', { emitEvent: false });
        storageCode.disable({ emitEvent: false });

        if (value) {
          deviceCode.enable({ emitEvent: false });
          this.tradeInFacade.loadDevices(categoryCode.value, value);
        } else {
          deviceCode.disable({ emitEvent: false });
        }
      });

    deviceCode.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        storageCode.reset('', { emitEvent: false });

        if (value) {
          storageCode.enable({ emitEvent: false });
          this.tradeInFacade.loadStorages(value);
        } else {
          storageCode.disable({ emitEvent: false });
        }
      });
  }

  private ensureConditionControls(fields: TradeInStepThreeField[]): void {
    fields.forEach((field) => {
      if (this.conditionForm.contains(field.code)) return;

      this.conditionForm.addControl(
        field.code,
        this.fb.control<string | null>(
          field.response || null,
          Validators.required,
        ),
      );
    });
  }
}

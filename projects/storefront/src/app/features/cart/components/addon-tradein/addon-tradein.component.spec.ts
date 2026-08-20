import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  TradeInBrand,
  TradeInCategory,
  TradeInDevice,
  TradeInSession,
  TradeInStepThreeField,
  TradeInStorage,
} from '@orange/core/models';
import { BehaviorSubject, of } from 'rxjs';
import { TradeInFacade } from 'src/app/features/trade-in/store/trade-in.facade';
import providers from 'src/test-providers';

import { AddonTradeinComponent } from './addon-tradein.component';

describe('AddonTradeinComponent', () => {
  let component: AddonTradeinComponent;
  let fixture: ComponentFixture<AddonTradeinComponent>;
  let categories$: BehaviorSubject<TradeInCategory[]>;
  let brands$: BehaviorSubject<TradeInBrand[]>;
  let devices$: BehaviorSubject<TradeInDevice[]>;
  let storages$: BehaviorSubject<TradeInStorage[]>;
  let session$: BehaviorSubject<TradeInSession | null>;
  let facade: {
    reset: ReturnType<typeof vi.fn>;
    loadConfig: ReturnType<typeof vi.fn>;
    loadCategories: ReturnType<typeof vi.fn>;
    loadBrands: ReturnType<typeof vi.fn>;
    loadDevices: ReturnType<typeof vi.fn>;
    loadStorages: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
    updateStepOne: ReturnType<typeof vi.fn>;
    updateStepTwo: ReturnType<typeof vi.fn>;
    updateStepThree: ReturnType<typeof vi.fn>;
    confirmSession: ReturnType<typeof vi.fn>;
  };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    categories$ = new BehaviorSubject<TradeInCategory[]>([]);
    brands$ = new BehaviorSubject<TradeInBrand[]>([]);
    devices$ = new BehaviorSubject<TradeInDevice[]>([]);
    storages$ = new BehaviorSubject<TradeInStorage[]>([]);
    session$ = new BehaviorSubject<TradeInSession | null>(null);
    facade = {
      reset: vi.fn(),
      loadConfig: vi.fn(),
      loadCategories: vi.fn(),
      loadBrands: vi.fn(),
      loadDevices: vi.fn(),
      loadStorages: vi.fn(),
      createSession: vi.fn(),
      updateStepOne: vi.fn(),
      updateStepTwo: vi.fn(),
      updateStepThree: vi.fn(),
      confirmSession: vi.fn(),
    };
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AddonTradeinComponent],
      providers: [
        ...providers,
        {
          provide: TradeInFacade,
          useValue: {
            ...facade,
            config$: of(null),
            categories$,
            brands$,
            devices$,
            storages$,
            currentSession$: session$,
            busy$: of(false),
            error$: of(null),
          },
        },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            productId: 42,
            addon: {
              id: 'trade-in',
              name: 'Trade in',
              title: 'Trade in a device',
              description: 'Exchange an old device.',
              imageUrl: '',
              isAdded: false,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddonTradeinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the trade-in flow and submits a valid first step', () => {
    expect(facade.reset).toHaveBeenCalled();
    expect(facade.loadConfig).toHaveBeenCalled();
    expect(facade.loadCategories).toHaveBeenCalled();
    expect(facade.createSession).toHaveBeenCalledWith({ productId: 42 });
    expect(component.canContinueStepOne()).toBe(false);

    categories$.next([{ category: 'Phone', code: 'phones', name: 'Phones' }]);
    brands$.next([
      {
        brandName: 'Orange fallback',
        code: 'orange',
        amount: 100,
        categoryCode: 'phones',
        name: 'Orange',
      },
    ]);
    devices$.next([
      {
        deviceName: 'Orange One fallback',
        brandName: 'Orange',
        code: 'orange-one',
        amount: 200,
        categoryCode: 'phones',
        name: 'Orange One',
      },
    ]);
    storages$.next([
      {
        size: '256 GB fallback',
        code: '256',
        amount: 300,
        deviceCode: 'orange-one',
        name: '256 GB',
      },
    ]);
    session$.next(createSession());

    component.stepOneForm.controls.postalCode.setValue(' 1000 ');
    component.stepOneForm.controls.categoryCode.setValue('phones');
    component.stepOneForm.controls.brandCode.setValue('orange');
    component.stepOneForm.controls.deviceCode.setValue('orange-one');
    component.stepOneForm.controls.storageCode.setValue('256');

    expect(component.categoryCode).toBe('phones');
    expect(component.brandCode).toBe('orange');
    expect(component.deviceCode).toBe('orange-one');
    expect(component.storageCode).toBe('256');
    expect(component.selectedCategoryName).toBe('Phones');
    expect(component.selectedBrandName).toBe('Orange');
    expect(component.selectedDeviceName).toBe('Orange One');
    expect(component.selectedStorageName).toBe('256 GB');
    expect(component.selectedBrand?.code).toBe('orange');
    expect(component.selectedDevice?.code).toBe('orange-one');
    expect(component.selectedStorage?.code).toBe('256');
    expect(component.estimateAmount).toBe(600);
    expect(component.canContinueStepOne()).toBe(true);

    component.continueFromStepOne();

    expect(facade.loadBrands).toHaveBeenCalledWith('phones');
    expect(facade.loadDevices).toHaveBeenCalledWith('phones', 'orange');
    expect(facade.loadStorages).toHaveBeenCalledWith('orange-one');
    expect(facade.updateStepOne).toHaveBeenCalledWith('session-1', {
      formData: {
        postalCode: '1000',
        category: 'Phones',
        brand: 'Orange',
        device: 'Orange One',
        storage: '256 GB',
      },
      summary: {
        brand: 'Orange',
        device: 'Orange One',
        storage: '256 GB',
        finalAmount: 600,
      },
    });
    expect(component.activeStep).toBe(2);
  });

  it('submits the remaining steps, confirms, navigates back, and cancels', () => {
    const fields: TradeInStepThreeField[] = [
      {
        code: 'powers-on',
        question: 'Does it power on?',
        info: 'Charge it first.',
        response: '',
      },
    ];
    const session = createSession({
      stepTwo: {
        text1: 'Find the IMEI',
        icon: 'phone',
        iconText: 'Dial *#06#',
        text2: 'Enter it below',
        imei: { label: 'IMEI', placeholder: '15 digits', value: ' 12345 ' },
      },
      stepThree: fields,
    });

    component.continueFromStepTwo();
    component.continueFromStepThree(fields);
    component.confirm();
    expect(facade.updateStepTwo).not.toHaveBeenCalled();
    expect(facade.updateStepThree).not.toHaveBeenCalled();
    expect(facade.confirmSession).not.toHaveBeenCalled();

    session$.next(session);

    component.continueFromStepTwo();
    expect(facade.updateStepTwo).toHaveBeenCalledWith('session-1', {
      stepTwo: {
        ...session.stepTwo,
        imei: {
          label: 'IMEI',
          placeholder: '15 digits',
          value: '12345',
        },
      },
    });
    expect(component.activeStep).toBe(3);

    expect(component.canContinueStepThree(fields)).toBe(false);
    expect(component.canContinueStepThree(undefined)).toBe(true);
    expect(component.getConditionResponse('missing')).toBeNull();
    component.setConditionResponse('powers-on', 'yes');
    expect(component.getConditionResponse('powers-on')).toBe('yes');
    expect(component.canContinueStepThree(fields)).toBe(true);

    component.continueFromStepThree(fields);
    expect(facade.updateStepThree).toHaveBeenCalledWith('session-1', {
      stepThree: [{ ...fields[0], response: 'yes' }],
    });
    expect(component.activeStep).toBe(4);

    component.goBack();
    expect(component.activeStep).toBe(3);
    component.activeStep = 1;
    component.goBack();
    expect(component.activeStep).toBe(1);

    component.confirm();
    expect(facade.confirmSession).toHaveBeenCalledWith('session-1');
    session$.next({ ...session, isConfirmed: true });
    expect(dialogRef.close).toHaveBeenCalledWith({
      tradeInSessionId: 'session-1',
    });

    component.cancel();
    expect(dialogRef.close).toHaveBeenLastCalledWith();
  });
});

function createSession(
  overrides: Partial<TradeInSession> = {},
): TradeInSession {
  return {
    sessionId: 'session-1',
    currentStep: 1,
    isConfirmed: false,
    createdAtUtc: '2026-08-20T00:00:00Z',
    updatedAtUtc: '2026-08-20T00:00:00Z',
    ...overrides,
  };
}

import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { TradeInActions } from './trade-in.actions';
import { TradeInFacade } from './trade-in.facade';

describe('TradeInFacade', () => {
  let facade: TradeInFacade;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TradeInFacade, provideMockStore()],
    });

    facade = TestBed.inject(TradeInFacade);
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('dispatches trade-in commands with their supplied values', () => {
    const createRequest = { productId: 42 };
    const stepOneRequest = {
      formData: {
        postalCode: '1000',
        category: 'Phone',
        brand: 'Orange',
        device: 'Orange One',
        storage: '256 GB',
      },
    };
    const stepTwoRequest = {
      stepTwo: {
        text1: 'Find the IMEI',
        icon: 'phone',
        iconText: 'Dial *#06#',
        text2: 'Enter it below',
        imei: { label: 'IMEI', placeholder: '15 digits', value: '123456789' },
      },
    };
    const stepThreeRequest = {
      stepThree: [
        { code: 'powers-on', question: 'Powers on?', info: '', response: 'yes' },
      ],
    };

    facade.reset();
    facade.loadConfig();
    facade.loadCategories();
    facade.loadBrands('phones');
    facade.loadDevices('phones', 'orange');
    facade.loadStorages('orange-one');
    facade.createSession(createRequest);
    facade.loadSession('session-1');
    facade.updateStepOne('session-1', stepOneRequest);
    facade.updateStepTwo('session-1', stepTwoRequest);
    facade.updateStepThree('session-1', stepThreeRequest);
    facade.confirmSession('session-1');

    expect(store.dispatch).toHaveBeenNthCalledWith(1, TradeInActions.reset());
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      TradeInActions.loadConfig(),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      TradeInActions.loadCategories(),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      4,
      TradeInActions.loadBrands({ categoryCode: 'phones' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      5,
      TradeInActions.loadDevices({
        categoryCode: 'phones',
        brandCode: 'orange',
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      6,
      TradeInActions.loadStorages({ deviceCode: 'orange-one' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      7,
      TradeInActions.createSession({ request: createRequest }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      8,
      TradeInActions.loadSession({ sessionId: 'session-1' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      9,
      TradeInActions.updateStepOne({
        sessionId: 'session-1',
        request: stepOneRequest,
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      10,
      TradeInActions.updateStepTwo({
        sessionId: 'session-1',
        request: stepTwoRequest,
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      11,
      TradeInActions.updateStepThree({
        sessionId: 'session-1',
        request: stepThreeRequest,
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      12,
      TradeInActions.confirmSession({ sessionId: 'session-1' }),
    );
  });
});

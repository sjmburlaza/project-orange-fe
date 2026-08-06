import { createFeature, createReducer, on } from '@ngrx/store';
import {
  TradeInBrand,
  TradeInCategory,
  TradeInConfig,
  TradeInDevice,
  TradeInSession,
  TradeInStorage,
} from '@orange/core/models';
import { TradeInActions } from './trade-in.actions';

export interface TradeInState {
  config: TradeInConfig | null;
  categories: TradeInCategory[];
  brands: TradeInBrand[];
  devices: TradeInDevice[];
  storages: TradeInStorage[];
  currentSession: TradeInSession | null;

  loadingConfig: boolean;
  loadingCategories: boolean;
  loadingBrands: boolean;
  loadingDevices: boolean;
  loadingStorages: boolean;
  loadingSession: boolean;
  savingSession: boolean;
  confirmingSession: boolean;

  error: string | null;
}

export const initialTradeInState: TradeInState = {
  config: null,
  categories: [],
  brands: [],
  devices: [],
  storages: [],
  currentSession: null,

  loadingConfig: false,
  loadingCategories: false,
  loadingBrands: false,
  loadingDevices: false,
  loadingStorages: false,
  loadingSession: false,
  savingSession: false,
  confirmingSession: false,

  error: null,
};

export const tradeInFeature = createFeature({
  name: 'tradeIn',
  reducer: createReducer(
    initialTradeInState,

    on(TradeInActions.loadConfig, (state) => ({
      ...state,
      loadingConfig: true,
      error: null,
    })),

    on(TradeInActions.loadConfigSuccess, (state, { config }) => ({
      ...state,
      config,
      loadingConfig: false,
    })),

    on(TradeInActions.loadCategories, (state) => ({
      ...state,
      loadingCategories: true,
      error: null,
    })),

    on(TradeInActions.loadCategoriesSuccess, (state, { categories }) => ({
      ...state,
      categories,
      loadingCategories: false,
    })),

    on(TradeInActions.loadBrands, (state) => ({
      ...state,
      brands: [],
      devices: [],
      storages: [],
      loadingBrands: true,
      error: null,
    })),

    on(TradeInActions.loadBrandsSuccess, (state, { brands }) => ({
      ...state,
      brands,
      loadingBrands: false,
    })),

    on(TradeInActions.loadDevices, (state) => ({
      ...state,
      devices: [],
      storages: [],
      loadingDevices: true,
      error: null,
    })),

    on(TradeInActions.loadDevicesSuccess, (state, { devices }) => ({
      ...state,
      devices,
      loadingDevices: false,
    })),

    on(TradeInActions.loadStorages, (state) => ({
      ...state,
      storages: [],
      loadingStorages: true,
      error: null,
    })),

    on(TradeInActions.loadStoragesSuccess, (state, { storages }) => ({
      ...state,
      storages,
      loadingStorages: false,
    })),

    on(TradeInActions.createSession, TradeInActions.loadSession, (state) => ({
      ...state,
      loadingSession: true,
      error: null,
    })),

    on(
      TradeInActions.createSessionSuccess,
      TradeInActions.loadSessionSuccess,
      (state, { session }) => ({
        ...state,
        currentSession: session,
        loadingSession: false,
      }),
    ),

    on(
      TradeInActions.updateStepOne,
      TradeInActions.updateStepTwo,
      TradeInActions.updateStepThree,
      (state) => ({
        ...state,
        savingSession: true,
        error: null,
      }),
    ),

    on(
      TradeInActions.updateStepOneSuccess,
      TradeInActions.updateStepTwoSuccess,
      TradeInActions.updateStepThreeSuccess,
      (state, { session }) => ({
        ...state,
        currentSession: session,
        savingSession: false,
      }),
    ),

    on(TradeInActions.confirmSession, (state) => ({
      ...state,
      confirmingSession: true,
      error: null,
    })),

    on(TradeInActions.confirmSessionSuccess, (state, { session }) => ({
      ...state,
      currentSession: session,
      confirmingSession: false,
    })),

    on(
      TradeInActions.loadConfigFailure,
      TradeInActions.loadCategoriesFailure,
      TradeInActions.loadBrandsFailure,
      TradeInActions.loadDevicesFailure,
      TradeInActions.loadStoragesFailure,
      TradeInActions.createSessionFailure,
      TradeInActions.loadSessionFailure,
      TradeInActions.updateStepOneFailure,
      TradeInActions.updateStepTwoFailure,
      TradeInActions.updateStepThreeFailure,
      TradeInActions.confirmSessionFailure,
      (state, { error }) => ({
        ...state,
        loadingConfig: false,
        loadingCategories: false,
        loadingBrands: false,
        loadingDevices: false,
        loadingStorages: false,
        loadingSession: false,
        savingSession: false,
        confirmingSession: false,
        error,
      }),
    ),

    on(TradeInActions.reset, () => initialTradeInState),
  ),
});

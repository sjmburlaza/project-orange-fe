import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CreateTradeInSessionRequest,
  UpdateTradeInStepOneRequest,
  UpdateTradeInStepThreeRequest,
  UpdateTradeInStepTwoRequest,
} from '@orange/core/models';
import { TradeInActions } from './trade-in.actions';
import {
  selectBrands,
  selectBusy,
  selectCategories,
  selectConfig,
  selectConfirmingSession,
  selectCurrentSession,
  selectDevices,
  selectError,
  selectLoadingBrands,
  selectLoadingCategories,
  selectLoadingConfig,
  selectLoadingDevices,
  selectLoadingOptions,
  selectLoadingSession,
  selectLoadingStorages,
  selectSavingSession,
  selectStorages,
} from './trade-in.selector';

@Injectable({ providedIn: 'root' })
export class TradeInFacade {
  private readonly store = inject(Store);

  readonly config$ = this.store.select(selectConfig);
  readonly categories$ = this.store.select(selectCategories);
  readonly brands$ = this.store.select(selectBrands);
  readonly devices$ = this.store.select(selectDevices);
  readonly storages$ = this.store.select(selectStorages);
  readonly currentSession$ = this.store.select(selectCurrentSession);

  readonly loadingConfig$ = this.store.select(selectLoadingConfig);
  readonly loadingCategories$ = this.store.select(selectLoadingCategories);
  readonly loadingBrands$ = this.store.select(selectLoadingBrands);
  readonly loadingDevices$ = this.store.select(selectLoadingDevices);
  readonly loadingStorages$ = this.store.select(selectLoadingStorages);
  readonly loadingOptions$ = this.store.select(selectLoadingOptions);
  readonly loadingSession$ = this.store.select(selectLoadingSession);
  readonly savingSession$ = this.store.select(selectSavingSession);
  readonly confirmingSession$ = this.store.select(selectConfirmingSession);
  readonly busy$ = this.store.select(selectBusy);
  readonly error$ = this.store.select(selectError);

  reset(): void {
    this.store.dispatch(TradeInActions.reset());
  }

  loadConfig(): void {
    this.store.dispatch(TradeInActions.loadConfig());
  }

  loadCategories(): void {
    this.store.dispatch(TradeInActions.loadCategories());
  }

  loadBrands(categoryCode: string | null): void {
    this.store.dispatch(TradeInActions.loadBrands({ categoryCode }));
  }

  loadDevices(categoryCode: string | null, brandCode: string | null): void {
    this.store.dispatch(
      TradeInActions.loadDevices({
        categoryCode,
        brandCode,
      }),
    );
  }

  loadStorages(deviceCode: string | null): void {
    this.store.dispatch(TradeInActions.loadStorages({ deviceCode }));
  }

  createSession(request?: CreateTradeInSessionRequest): void {
    this.store.dispatch(TradeInActions.createSession({ request }));
  }

  loadSession(sessionId: string): void {
    this.store.dispatch(TradeInActions.loadSession({ sessionId }));
  }

  updateStepOne(
    sessionId: string,
    request: UpdateTradeInStepOneRequest,
  ): void {
    this.store.dispatch(TradeInActions.updateStepOne({ sessionId, request }));
  }

  updateStepTwo(
    sessionId: string,
    request: UpdateTradeInStepTwoRequest,
  ): void {
    this.store.dispatch(TradeInActions.updateStepTwo({ sessionId, request }));
  }

  updateStepThree(
    sessionId: string,
    request: UpdateTradeInStepThreeRequest,
  ): void {
    this.store.dispatch(
      TradeInActions.updateStepThree({
        sessionId,
        request,
      }),
    );
  }

  confirmSession(sessionId: string): void {
    this.store.dispatch(TradeInActions.confirmSession({ sessionId }));
  }
}

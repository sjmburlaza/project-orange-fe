import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateTradeInSessionRequest,
  TradeInBrand,
  TradeInCategory,
  TradeInConfig,
  TradeInDevice,
  TradeInSession,
  TradeInStorage,
  UpdateTradeInStepOneRequest,
  UpdateTradeInStepThreeRequest,
  UpdateTradeInStepTwoRequest,
} from '@orange/core/models';

export const TradeInActions = createActionGroup({
  source: 'Trade In',
  events: {
    'Load Config': emptyProps(),
    'Load Config Success': props<{ config: TradeInConfig }>(),
    'Load Config Failure': props<{ error: string }>(),

    'Load Categories': emptyProps(),
    'Load Categories Success': props<{ categories: TradeInCategory[] }>(),
    'Load Categories Failure': props<{ error: string }>(),

    'Load Brands': props<{ categoryCode: string | null }>(),
    'Load Brands Success': props<{ brands: TradeInBrand[] }>(),
    'Load Brands Failure': props<{ error: string }>(),

    'Load Devices': props<{
      categoryCode: string | null;
      brandCode: string | null;
    }>(),
    'Load Devices Success': props<{ devices: TradeInDevice[] }>(),
    'Load Devices Failure': props<{ error: string }>(),

    'Load Storages': props<{ deviceCode: string | null }>(),
    'Load Storages Success': props<{ storages: TradeInStorage[] }>(),
    'Load Storages Failure': props<{ error: string }>(),

    'Create Session': props<{ request?: CreateTradeInSessionRequest }>(),
    'Create Session Success': props<{ session: TradeInSession }>(),
    'Create Session Failure': props<{ error: string }>(),

    'Load Session': props<{ sessionId: string }>(),
    'Load Session Success': props<{ session: TradeInSession }>(),
    'Load Session Failure': props<{ error: string }>(),

    'Update Step One': props<{
      sessionId: string;
      request: UpdateTradeInStepOneRequest;
    }>(),
    'Update Step One Success': props<{ session: TradeInSession }>(),
    'Update Step One Failure': props<{ error: string }>(),

    'Update Step Two': props<{
      sessionId: string;
      request: UpdateTradeInStepTwoRequest;
    }>(),
    'Update Step Two Success': props<{ session: TradeInSession }>(),
    'Update Step Two Failure': props<{ error: string }>(),

    'Update Step Three': props<{
      sessionId: string;
      request: UpdateTradeInStepThreeRequest;
    }>(),
    'Update Step Three Success': props<{ session: TradeInSession }>(),
    'Update Step Three Failure': props<{ error: string }>(),

    'Confirm Session': props<{ sessionId: string }>(),
    'Confirm Session Success': props<{ session: TradeInSession }>(),
    'Confirm Session Failure': props<{ error: string }>(),

    'Reset': emptyProps(),
  },
});

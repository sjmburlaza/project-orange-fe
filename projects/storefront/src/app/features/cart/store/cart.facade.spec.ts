import { TestBed } from '@angular/core/testing';
import { Actions } from '@ngrx/effects';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { EMPTY } from 'rxjs';

import { CartActions } from './cart.actions';
import { CartFacade } from './cart.facade';

describe('CartFacade', () => {
  let facade: CartFacade;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartFacade,
        provideMockStore(),
        { provide: Actions, useValue: EMPTY },
      ],
    });

    facade = TestBed.inject(CartFacade);
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('dispatches cart commands with their supplied values', () => {
    const addRequest = {
      variantId: 1001,
      quantity: 2,
      addons: [],
    };
    const addonRequest = { insurancePlanCode: 'protect-plus' };

    facade.loadCart();
    facade.loadRecommendedProducts();
    facade.addToCart(addRequest);
    facade.updateQuantity(1001, 3);
    facade.removeItem(1001);
    facade.upsertItemAddon(1001, 'insurance', addonRequest);
    facade.removeItemAddon(1001, 'insurance');
    facade.applyVoucher('SAVE10');
    facade.removeVoucher('SAVE10');
    facade.clearVoucherError();
    facade.updateShipping('1000', 'standard');
    facade.clearCart();

    expect(store.dispatch).toHaveBeenNthCalledWith(1, CartActions.loadCart());
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      CartActions.loadRecommendedProducts(),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      CartActions.addToCart({ request: addRequest }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      4,
      CartActions.updateQuantity({ variantId: 1001, quantity: 3 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      5,
      CartActions.removeItem({ variantId: 1001 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      6,
      CartActions.upsertItemAddon({
        variantId: 1001,
        addonId: 'insurance',
        request: addonRequest,
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      7,
      CartActions.removeItemAddon({
        variantId: 1001,
        addonId: 'insurance',
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      8,
      CartActions.applyVoucher({ code: 'SAVE10' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      9,
      CartActions.removeVoucher({ code: 'SAVE10' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      10,
      CartActions.clearVoucherError(),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      11,
      CartActions.updateShipping({
        postalCode: '1000',
        shippingMethodCode: 'standard',
      }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(12, CartActions.clearCart());
  });
});

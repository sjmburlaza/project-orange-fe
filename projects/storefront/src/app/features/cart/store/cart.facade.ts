import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AddToCartRequest,
  UpdateCartItemAddonRequest,
} from '@orange/core/models';
import { CartActions } from './cart.actions';
import {
  selectCart,
  selectCartItems,
  selectCartSummary,
  selectCartItemCount,
  selectCartTotal,
  selectRecommendedProducts,
  selectLoading,
  selectLoadingRecommendedProducts,
  selectError,
  selectRecommendedProductsError,
  selectAppliedVouchers,
  selectVoucherError,
} from './cart.selector';
import { Actions, ofType } from '@ngrx/effects';

@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  readonly cart$ = this.store.select(selectCart);
  readonly items$ = this.store.select(selectCartItems);
  readonly summary$ = this.store.select(selectCartSummary);
  readonly itemCount$ = this.store.select(selectCartItemCount);
  readonly total$ = this.store.select(selectCartTotal);
  readonly recommendedProducts$ = this.store.select(selectRecommendedProducts);
  readonly loading$ = this.store.select(selectLoading);
  readonly loadingRecommendedProducts$ = this.store.select(
    selectLoadingRecommendedProducts,
  );
  readonly error$ = this.store.select(selectError);
  readonly recommendedProductsError$ = this.store.select(
    selectRecommendedProductsError,
  );
  readonly appliedVouchers$ = this.store.select(selectAppliedVouchers);
  readonly voucherError$ = this.store.select(selectVoucherError);

  readonly addToCartSuccess$ = this.actions$.pipe(
    ofType(CartActions.addToCartSuccess),
  );

  loadCart(): void {
    this.store.dispatch(CartActions.loadCart());
  }

  loadRecommendedProducts(): void {
    this.store.dispatch(CartActions.loadRecommendedProducts());
  }

  addToCart(request: AddToCartRequest): void {
    this.store.dispatch(CartActions.addToCart({ request }));
  }

  updateQuantity(variantId: number, quantity: number): void {
    this.store.dispatch(
      CartActions.updateQuantity({
        variantId,
        quantity,
      }),
    );
  }

  removeItem(variantId: number): void {
    this.store.dispatch(CartActions.removeItem({ variantId }));
  }

  upsertItemAddon(
    variantId: number,
    addonId: string,
    request: UpdateCartItemAddonRequest,
  ): void {
    this.store.dispatch(
      CartActions.upsertItemAddon({
        variantId,
        addonId,
        request,
      }),
    );
  }

  removeItemAddon(variantId: number, addonId: string): void {
    this.store.dispatch(CartActions.removeItemAddon({ variantId, addonId }));
  }

  applyVoucher(code: string): void {
    this.store.dispatch(CartActions.applyVoucher({ code }));
  }

  removeVoucher(code: string): void {
    this.store.dispatch(CartActions.removeVoucher({ code }));
  }

  clearVoucherError(): void {
    this.store.dispatch(CartActions.clearVoucherError());
  }

  updateShipping(postalCode: string, shippingMethodCode: string): void {
    this.store.dispatch(
      CartActions.updateShipping({
        postalCode,
        shippingMethodCode,
      }),
    );
  }

  clearCart(): void {
    this.store.dispatch(CartActions.clearCart());
  }
}

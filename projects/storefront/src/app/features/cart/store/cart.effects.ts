import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CartApiService } from '../services/cart-api.service';
import { CartActions } from './cart.actions';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { CartUiMessage } from '@orange/core/models';

interface ApiErrorResponse {
  code?: string;
  errorDetails?: {
    minimumSubtotal?: number | string;
  };
  minimumSubtotal?: number | string;
}

const voucherErrorKeys: Record<string, string> = {
  CART_NOT_FOUND: 'cart.voucher.error.cartNotFound',
  VOUCHER_ALREADY_APPLIED: 'cart.voucher.error.alreadyApplied',
  VOUCHER_CODE_INVALID_FORMAT: 'cart.voucher.error.invalidFormat',
  VOUCHER_LIMIT_REACHED: 'cart.voucher.error.limitReached',
  VOUCHER_NOT_APPLICABLE: 'cart.voucher.error.notApplicable',
};

@Injectable()
export class CartEffects {
  private readonly actions$ = inject(Actions);
  private readonly cartApi = inject(CartApiService);

  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      switchMap(() =>
        this.cartApi.getCart().pipe(
          map((cart) => CartActions.loadCartSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.loadCartFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadRecommendedProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadRecommendedProducts),
      switchMap(() =>
        this.cartApi.getRecommendedProducts().pipe(
          map((products) =>
            CartActions.loadRecommendedProductsSuccess({ products }),
          ),
          catchError((error) =>
            of(
              CartActions.loadRecommendedProductsFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  addToCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addToCart),
      switchMap(({ request }) =>
        this.cartApi.addToCart(request).pipe(
          tap((cart) => {
            this.cartApi.saveCartCode(cart.code);
          }),
          map((cart) => CartActions.addToCartSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.addToCartFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateQuantity),
      switchMap(({ variantId, quantity }) =>
        this.cartApi.updateQuantity(variantId, { quantity }).pipe(
          map((cart) => CartActions.updateQuantitySuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.updateQuantityFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  removeItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeItem),
      switchMap(({ variantId }) =>
        this.cartApi.removeItem(variantId).pipe(
          map((cart) => CartActions.removeItemSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.removeItemFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  upsertItemAddon$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.upsertItemAddon),
      switchMap(({ variantId, addonId, request }) =>
        this.cartApi.upsertItemAddon(variantId, addonId, request).pipe(
          map((cart) => CartActions.upsertItemAddonSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.upsertItemAddonFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  removeItemAddon$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeItemAddon),
      switchMap(({ variantId, addonId }) =>
        this.cartApi.removeItemAddon(variantId, addonId).pipe(
          map((cart) => CartActions.removeItemAddonSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.removeItemAddonFailure({
                error: this.getErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  applyVoucher$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.applyVoucher),
      switchMap(({ code }) =>
        this.cartApi.applyVoucher({ code }).pipe(
          map((cart) => CartActions.applyVoucherSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.applyVoucherFailure({
                error: this.getVoucherErrorMessage(
                  error,
                  'cart.voucher.error.applyFailed',
                ),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  removeVoucher$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeVoucher),
      switchMap(({ code }) =>
        this.cartApi.removeVoucher(code).pipe(
          map((cart) => CartActions.removeVoucherSuccess({ cart })),
          catchError((error) =>
            of(
              CartActions.removeVoucherFailure({
                error: this.getVoucherErrorMessage(
                  error,
                  'cart.voucher.error.removeFailed',
                ),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateShipping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateShipping),
      switchMap(({ postalCode, shippingMethodCode }) =>
        this.cartApi
          .updateShipping({
            postalCode,
            shippingMethodCode,
          })
          .pipe(
            map((cart) => CartActions.updateShippingSuccess({ cart })),
            catchError((error) =>
              of(
                CartActions.updateShippingFailure({
                  error: this.getErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  clearCart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.clearCart),
        tap(() => {
          this.cartApi.clearCartCode();
        }),
      ),
    { dispatch: false },
  );

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong.';
  }

  private getVoucherErrorMessage(
    error: unknown,
    fallbackKey: string,
  ): CartUiMessage {
    if (!(error instanceof HttpErrorResponse)) {
      return { key: fallbackKey };
    }

    const apiError = error.error as ApiErrorResponse | null;
    const code = apiError?.code;

    if (code === 'VOUCHER_MINIMUM_SUBTOTAL_NOT_MET') {
      const minimumSubtotal =
        apiError?.errorDetails?.minimumSubtotal ?? apiError?.minimumSubtotal;
      const amount = Number(minimumSubtotal);

      return {
        key: 'cart.voucher.error.minimumSubtotalNotMet',
        params: Number.isFinite(amount)
          ? { minimumSubtotal: amount.toFixed(2) }
          : undefined,
      };
    }

    return {
      key: code ? (voucherErrorKeys[code] ?? fallbackKey) : fallbackKey,
    };
  }
}

import { createFeature, createReducer, on } from '@ngrx/store';
import { Cart } from '@orange/core/models';
import { CartActions } from './cart.actions';
import { CartUiMessage } from '@orange/core/models';
import { ProductConfigure } from '@orange/core/models';

export interface CartState {
  cart: Cart | null;
  recommendedProducts: ProductConfigure[];
  loading: boolean;
  loadingRecommendedProducts: boolean;
  error: string | null;
  recommendedProductsError: string | null;
  voucherError: CartUiMessage | null;
}

export const initialCartState: CartState = {
  cart: null,
  recommendedProducts: [],
  loading: false,
  loadingRecommendedProducts: false,
  error: null,
  recommendedProductsError: null,
  voucherError: null,
};

export const cartFeature = createFeature({
  name: 'cart',

  reducer: createReducer(
    initialCartState,

    on(
      CartActions.loadCart,
      CartActions.addToCart,
      CartActions.updateQuantity,
      CartActions.removeItem,
      CartActions.upsertItemAddon,
      CartActions.removeItemAddon,
      CartActions.updateShipping,
      (state) => ({
        ...state,
        loading: true,
        error: null,
      }),
    ),

    on(
      CartActions.loadCartSuccess,
      CartActions.addToCartSuccess,
      CartActions.updateQuantitySuccess,
      CartActions.removeItemSuccess,
      CartActions.upsertItemAddonSuccess,
      CartActions.removeItemAddonSuccess,
      CartActions.updateShippingSuccess,
      (state, { cart }) => ({
        ...state,
        cart,
        loading: false,
        error: null,
      }),
    ),

    on(
      CartActions.loadCartFailure,
      CartActions.addToCartFailure,
      CartActions.updateQuantityFailure,
      CartActions.removeItemFailure,
      CartActions.upsertItemAddonFailure,
      CartActions.removeItemAddonFailure,
      CartActions.updateShippingFailure,
      (state, { error }) => ({
        ...state,
        loading: false,
        error,
      }),
    ),

    on(CartActions.loadRecommendedProducts, (state) => ({
      ...state,
      loadingRecommendedProducts: true,
      recommendedProductsError: null,
    })),

    on(CartActions.loadRecommendedProductsSuccess, (state, { products }) => ({
      ...state,
      recommendedProducts: products,
      loadingRecommendedProducts: false,
      recommendedProductsError: null,
    })),

    on(CartActions.loadRecommendedProductsFailure, (state, { error }) => ({
      ...state,
      loadingRecommendedProducts: false,
      recommendedProductsError: error,
    })),

    on(CartActions.applyVoucher, CartActions.removeVoucher, (state) => ({
      ...state,
      loading: true,
      error: null,
      voucherError: null,
    })),

    on(
      CartActions.applyVoucherSuccess,
      CartActions.removeVoucherSuccess,
      (state, { cart }) => ({
        ...state,
        cart,
        loading: false,
        error: null,
        voucherError: null,
      }),
    ),

    on(
      CartActions.applyVoucherFailure,
      CartActions.removeVoucherFailure,
      (state, { error }) => ({
        ...state,
        loading: false,
        voucherError: error,
      }),
    ),

    on(CartActions.clearVoucherError, (state) => ({
      ...state,
      voucherError: null,
    })),

    on(CartActions.clearCart, () => initialCartState),
  ),
});

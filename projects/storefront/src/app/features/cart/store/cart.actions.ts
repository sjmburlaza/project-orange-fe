import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CartUiMessage } from '@orange/core/models';
import {
  AddToCartRequest,
  Cart,
  UpdateCartItemAddonRequest,
} from '@orange/core/models';
import { ProductConfigure } from '@orange/core/models';

export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Load Cart': emptyProps(),
    'Load Cart Success': props<{ cart: Cart | null }>(),
    'Load Cart Failure': props<{ error: string }>(),

    'Load Recommended Products': emptyProps(),
    'Load Recommended Products Success': props<{
      products: ProductConfigure[];
    }>(),
    'Load Recommended Products Failure': props<{ error: string }>(),

    'Add To Cart': props<{ request: AddToCartRequest }>(),
    'Add To Cart Success': props<{ cart: Cart }>(),
    'Add To Cart Failure': props<{ error: string }>(),

    'Update Quantity': props<{ variantId: number; quantity: number }>(),
    'Update Quantity Success': props<{ cart: Cart }>(),
    'Update Quantity Failure': props<{ error: string }>(),

    'Remove Item': props<{ variantId: number }>(),
    'Remove Item Success': props<{ cart: Cart }>(),
    'Remove Item Failure': props<{ error: string }>(),

    'Upsert Item Addon': props<{
      variantId: number;
      addonId: string;
      request: UpdateCartItemAddonRequest;
    }>(),
    'Upsert Item Addon Success': props<{ cart: Cart }>(),
    'Upsert Item Addon Failure': props<{ error: string }>(),

    'Remove Item Addon': props<{ variantId: number; addonId: string }>(),
    'Remove Item Addon Success': props<{ cart: Cart }>(),
    'Remove Item Addon Failure': props<{ error: string }>(),

    'Apply Voucher': props<{ code: string }>(),
    'Apply Voucher Success': props<{ cart: Cart }>(),
    'Apply Voucher Failure': props<{ error: CartUiMessage }>(),

    'Remove Voucher': props<{ code: string }>(),
    'Remove Voucher Success': props<{ cart: Cart }>(),
    'Remove Voucher Failure': props<{ error: CartUiMessage }>(),
    'Clear Voucher Error': emptyProps(),

    'Update Shipping': props<{
      postalCode: string;
      shippingMethodCode: string;
    }>(),
    'Update Shipping Success': props<{ cart: Cart }>(),
    'Update Shipping Failure': props<{ error: string }>(),

    'Clear Cart': emptyProps(),
  },
});

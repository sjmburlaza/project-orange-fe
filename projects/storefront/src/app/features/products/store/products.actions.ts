import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Category } from '@orange/core/models';
import {
  InsurancePlan,
  MobilePlan,
  Product,
  ProductConfigure,
  ProductFilters,
  ProductSort,
} from '@orange/core/models';

export const ProductActions = createActionGroup({
  source: 'Products',
  events: {
    'Load Products': props<{ filters?: Partial<ProductFilters> }>(),
    'Load Products Success': props<{
      products: Product[];
      filters?: Partial<ProductFilters>;
    }>(),
    'Load Products Failure': props<{ error: string }>(),

    'Load Categories': emptyProps(),
    'Load Categories Success': props<{ categories: Category[] }>(),
    'Load Categories Failure': props<{ error: string }>(),

    'Select Category': props<{ categoryId: number | null }>(),
    'Select Search': props<{ search: string | null }>(),
    'Select Sort': props<{ sortBy: ProductSort | null }>(),
    'Set Price Filter': props<{
      minPrice: number | null;
      maxPrice: number | null;
    }>(),

    'Clear Product Filters': emptyProps(),

    'Load Product Configure': props<{ id: number }>(),
    'Load Product Configure Success': props<{ product: ProductConfigure }>(),
    'Load Product Configure Failure': props<{ error: string }>(),

    'Load Product Insurance Plans': props<{ productId: number }>(),
    'Load Product Insurance Plans Success': props<{
      productId: number;
      plans: InsurancePlan[];
    }>(),
    'Load Product Insurance Plans Failure': props<{
      productId: number;
      error: string;
    }>(),

    'Load Product Mobile Plans': props<{ productId: number }>(),
    'Load Product Mobile Plans Success': props<{
      productId: number;
      plans: MobilePlan[];
    }>(),
    'Load Product Mobile Plans Failure': props<{
      productId: number;
      error: string;
    }>(),

    'Select Product': props<{ id: number }>(),
    'Clear Selected Product': emptyProps(),
  },
});

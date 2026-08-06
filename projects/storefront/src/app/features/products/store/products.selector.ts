import { createSelector } from '@ngrx/store';
import { ProductFilters } from '@orange/core/models';
import { productFeature } from 'src/app/features/products/store/products.reducer';

export const {
  selectProducts,
  selectProductConfigures,
  selectInsurancePlans,
  selectMobilePlans,
  selectSelectedProductId,

  selectCategories,
  selectSearch,
  selectSelectedCategoryId,

  selectSelectedSort,

  selectMinPrice,
  selectMaxPrice,
  selectPriceFilterMax,

  selectLoadingProducts,
  selectLoadingProductConfigure,
  selectLoadingInsurancePlans,
  selectLoadingMobilePlans,
  selectLoadingCategories,

  selectProductsError,
  selectProductConfigureError,
  selectInsurancePlansError,
  selectMobilePlansError,
  selectCategoriesError,
} = productFeature;

export const selectProductFilters = createSelector(
  selectSearch,
  selectSelectedCategoryId,
  selectSelectedSort,
  selectMinPrice,
  selectMaxPrice,
  (search, categoryId, sortBy, minPrice, maxPrice): ProductFilters => ({
    search,
    categoryId,
    sortBy,
    minPrice,
    maxPrice,
  }),
);

export const selectSelectedProductConfigure = createSelector(
  selectProductConfigures,
  selectSelectedProductId,
  (productConfigures, selectedProductId) => {
    if (selectedProductId === null) {
      return null;
    }

    return productConfigures[selectedProductId] ?? null;
  },
);

export const selectHasSelectedProductConfigure = createSelector(
  selectSelectedProductConfigure,
  (product) => product !== null,
);

export const selectInsurancePlansForProduct = (productId: number) =>
  createSelector(
    selectInsurancePlans,
    (plansByProduct) => plansByProduct[productId] ?? [],
  );

export const selectMobilePlansForProduct = (productId: number) =>
  createSelector(
    selectMobilePlans,
    (plansByProduct) => plansByProduct[productId] ?? [],
  );

export const selectLoadingInsurancePlansForProduct = (productId: number) =>
  createSelector(
    selectLoadingInsurancePlans,
    (loadingByProduct) => loadingByProduct[productId] ?? false,
  );

export const selectLoadingMobilePlansForProduct = (productId: number) =>
  createSelector(
    selectLoadingMobilePlans,
    (loadingByProduct) => loadingByProduct[productId] ?? false,
  );

export const selectInsurancePlansErrorForProduct = (productId: number) =>
  createSelector(
    selectInsurancePlansError,
    (errorsByProduct) => errorsByProduct[productId] ?? null,
  );

export const selectMobilePlansErrorForProduct = (productId: number) =>
  createSelector(
    selectMobilePlansError,
    (errorsByProduct) => errorsByProduct[productId] ?? null,
  );

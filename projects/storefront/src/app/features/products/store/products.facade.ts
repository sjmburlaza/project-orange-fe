import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { ProductActions } from 'src/app/features/products/store/products.actions';
import {
  InsurancePlan,
  MobilePlan,
  ProductSort,
} from '@orange/core/models';

import {
  selectProducts,
  selectSelectedProductId,
  selectSelectedProductConfigure,
  selectLoadingProducts,
  selectLoadingProductConfigure,
  selectProductsError,
  selectProductConfigureError,
  selectCategories,
  selectCategoriesError,
  selectLoadingCategories,
  selectSelectedCategoryId,
  selectSelectedSort,
  selectMinPrice,
  selectMaxPrice,
  selectPriceFilterMax,
  selectSearch,
  selectInsurancePlansForProduct,
  selectMobilePlansForProduct,
  selectLoadingInsurancePlansForProduct,
  selectLoadingMobilePlansForProduct,
  selectInsurancePlansErrorForProduct,
  selectMobilePlansErrorForProduct,
} from 'src/app/features/products/store/products.selector';

@Injectable({
  providedIn: 'root',
})
export class ProductFacade {
  private readonly store = inject(Store);

  readonly products$ = this.store.select(selectProducts);

  readonly selectedProductId$ = this.store.select(selectSelectedProductId);
  readonly selectedProductConfigure$ = this.store.select(
    selectSelectedProductConfigure,
  );

  readonly loadingProducts$ = this.store.select(selectLoadingProducts);
  readonly loadingProductConfigure$ = this.store.select(
    selectLoadingProductConfigure,
  );

  readonly productsError$ = this.store.select(selectProductsError);
  readonly productConfigureError$ = this.store.select(
    selectProductConfigureError,
  );

  readonly categories$ = this.store.select(selectCategories);
  readonly search$ = this.store.select(selectSearch);
  readonly selectedCategoryId$ = this.store.select(selectSelectedCategoryId);
  readonly loadingCategories$ = this.store.select(selectLoadingCategories);
  readonly categoriesError$ = this.store.select(selectCategoriesError);

  readonly selectedSort$ = this.store.select(selectSelectedSort);

  readonly minPrice$ = this.store.select(selectMinPrice);
  readonly maxPrice$ = this.store.select(selectMaxPrice);
  readonly priceFilterMax$ = this.store.select(selectPriceFilterMax);

  loadProducts(): void {
    this.store.dispatch(ProductActions.loadProducts({ filters: {} }));
  }

  loadCategories(): void {
    this.store.dispatch(ProductActions.loadCategories());
  }

  selectCategory(categoryId: number | null): void {
    this.store.dispatch(ProductActions.selectCategory({ categoryId }));
  }

  selectSearch(search: string | null): void {
    this.store.dispatch(ProductActions.selectSearch({ search }));
  }

  selectSort(sortBy: ProductSort | null): void {
    this.store.dispatch(ProductActions.selectSort({ sortBy }));
  }

  setPriceFilter(minPrice: number | null, maxPrice: number | null): void {
    this.store.dispatch(
      ProductActions.setPriceFilter({
        minPrice,
        maxPrice,
      }),
    );
  }

  clearProductFilters(): void {
    this.store.dispatch(ProductActions.clearProductFilters());
  }

  loadProductConfigure(id: number): void {
    this.store.dispatch(ProductActions.loadProductConfigure({ id }));
  }

  loadProductInsurancePlans(productId: number): void {
    this.store.dispatch(ProductActions.loadProductInsurancePlans({ productId }));
  }

  loadProductMobilePlans(productId: number): void {
    this.store.dispatch(ProductActions.loadProductMobilePlans({ productId }));
  }

  insurancePlans$(productId: number): Observable<InsurancePlan[]> {
    return this.store.select(selectInsurancePlansForProduct(productId));
  }

  mobilePlans$(productId: number): Observable<MobilePlan[]> {
    return this.store.select(selectMobilePlansForProduct(productId));
  }

  loadingInsurancePlans$(productId: number): Observable<boolean> {
    return this.store.select(selectLoadingInsurancePlansForProduct(productId));
  }

  loadingMobilePlans$(productId: number): Observable<boolean> {
    return this.store.select(selectLoadingMobilePlansForProduct(productId));
  }

  insurancePlansError$(productId: number): Observable<string | null> {
    return this.store.select(selectInsurancePlansErrorForProduct(productId));
  }

  mobilePlansError$(productId: number): Observable<string | null> {
    return this.store.select(selectMobilePlansErrorForProduct(productId));
  }

  selectProduct(id: number): void {
    this.store.dispatch(ProductActions.selectProduct({ id }));
  }

  clearSelectedProduct(): void {
    this.store.dispatch(ProductActions.clearSelectedProduct());
  }
}

import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { ProductActions } from './products.actions';
import { ProductFacade } from './products.facade';

describe('ProductFacade', () => {
  let facade: ProductFacade;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductFacade, provideMockStore()],
    });

    facade = TestBed.inject(ProductFacade);
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('dispatches product commands with their supplied values', () => {
    facade.loadProducts();
    facade.loadCategories();
    facade.selectCategory(3);
    facade.selectSearch('phone');
    facade.selectSort('price-asc');
    facade.setPriceFilter(1000, 50000);
    facade.clearProductFilters();
    facade.loadProductConfigure(42);
    facade.loadProductInsurancePlans(42);
    facade.loadProductMobilePlans(42);
    facade.selectProduct(42);
    facade.clearSelectedProduct();

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      ProductActions.loadProducts({ filters: {} }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      ProductActions.loadCategories(),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      ProductActions.selectCategory({ categoryId: 3 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      4,
      ProductActions.selectSearch({ search: 'phone' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      5,
      ProductActions.selectSort({ sortBy: 'price-asc' }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      6,
      ProductActions.setPriceFilter({ minPrice: 1000, maxPrice: 50000 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      7,
      ProductActions.clearProductFilters(),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      8,
      ProductActions.loadProductConfigure({ id: 42 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      9,
      ProductActions.loadProductInsurancePlans({ productId: 42 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      10,
      ProductActions.loadProductMobilePlans({ productId: 42 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      11,
      ProductActions.selectProduct({ id: 42 }),
    );
    expect(store.dispatch).toHaveBeenNthCalledWith(
      12,
      ProductActions.clearSelectedProduct(),
    );
  });
});

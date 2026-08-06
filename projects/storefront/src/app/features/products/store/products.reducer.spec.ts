import {
  InsurancePlan,
  Product,
  ProductConfigure,
  ProductVariant,
} from '@orange/core/models';
import { ProductActions } from './products.actions';
import { initialState, productFeature } from './products.reducer';

describe('products reducer', () => {
  it('sets loading state when products are requested', () => {
    const state = productFeature.reducer(
      {
        ...initialState,
        productsError: 'Previous failure',
      },
      ProductActions.loadProducts({ filters: { categoryId: 1 } }),
    );

    expect(state.loadingProducts).toBe(true);
    expect(state.productsError).toBeNull();
  });

  it('stores products and clears product loading state on success', () => {
    const products = [createProduct({ id: 1 }), createProduct({ id: 2 })];

    const state = productFeature.reducer(
      {
        ...initialState,
        loadingProducts: true,
        productsError: 'Previous failure',
      },
      ProductActions.loadProductsSuccess({ products }),
    );

    expect(state.products).toEqual(products);
    expect(state.priceFilterMax).toBe(39999);
    expect(state.loadingProducts).toBe(false);
    expect(state.productsError).toBeNull();
  });

  it('keeps the price filter max from shrinking after filtered product loads', () => {
    const state = productFeature.reducer(
      {
        ...initialState,
        priceFilterMax: 72990,
      },
      ProductActions.loadProductsSuccess({
        products: [createProduct({ id: 3, price: 3500 })],
        filters: { minPrice: 0, maxPrice: 5000 },
      }),
    );

    expect(state.priceFilterMax).toBe(72990);
  });

  it('tracks selected filters and clears them together', () => {
    const filteredState = [
      ProductActions.selectCategory({ categoryId: 7 }),
      ProductActions.selectSearch({ search: 'keyboard' }),
      ProductActions.selectSort({ sortBy: 'price-desc' }),
      ProductActions.setPriceFilter({ minPrice: 1000, maxPrice: 5000 }),
    ].reduce(productFeature.reducer, initialState);

    expect(filteredState.selectedCategoryId).toBe(7);
    expect(filteredState.search).toBe('keyboard');
    expect(filteredState.selectedSort).toBe('price-desc');
    expect(filteredState.minPrice).toBe(1000);
    expect(filteredState.maxPrice).toBe(5000);

    const clearedState = productFeature.reducer(
      filteredState,
      ProductActions.clearProductFilters(),
    );

    expect(clearedState.selectedCategoryId).toBeNull();
    expect(clearedState.search).toBeNull();
    expect(clearedState.selectedSort).toBeNull();
    expect(clearedState.minPrice).toBeNull();
    expect(clearedState.maxPrice).toBeNull();
  });

  it('caches loaded product configure data by product id', () => {
    const existingConfigure = createProductConfigure({
      id: 1,
      name: 'Phone One',
    });
    const loadedConfigure = createProductConfigure({
      id: 2,
      name: 'Phone Two',
    });

    const state = productFeature.reducer(
      {
        ...initialState,
        productConfigures: { [existingConfigure.id]: existingConfigure },
        selectedProductId: 2,
        loadingProductConfigure: true,
        productConfigureError: 'Previous failure',
      },
      ProductActions.loadProductConfigureSuccess({ product: loadedConfigure }),
    );

    expect(state.productConfigures).toEqual({
      [existingConfigure.id]: existingConfigure,
      [loadedConfigure.id]: loadedConfigure,
    });
    expect(state.selectedProductId).toBe(loadedConfigure.id);
    expect(state.loadingProductConfigure).toBe(false);
    expect(state.productConfigureError).toBeNull();
  });

  it('tracks addon loading and errors per product id', () => {
    const plans: InsurancePlan[] = [
      {
        name: 'Screen protection',
        code: 'screen-protect',
        description: 'Accidental damage protection',
        amount: 499,
      },
    ];

    const loadingState = productFeature.reducer(
      initialState,
      ProductActions.loadProductInsurancePlans({ productId: 42 }),
    );

    expect(loadingState.loadingInsurancePlans[42]).toBe(true);
    expect(loadingState.insurancePlansError[42]).toBeNull();

    const successState = productFeature.reducer(
      loadingState,
      ProductActions.loadProductInsurancePlansSuccess({
        productId: 42,
        plans,
      }),
    );

    expect(successState.insurancePlans[42]).toEqual(plans);
    expect(successState.loadingInsurancePlans[42]).toBe(false);
    expect(successState.insurancePlansError[42]).toBeNull();

    const failureState = productFeature.reducer(
      successState,
      ProductActions.loadProductMobilePlansFailure({
        productId: 99,
        error: 'Plans unavailable',
      }),
    );

    expect(failureState.loadingMobilePlans[99]).toBe(false);
    expect(failureState.mobilePlansError[99]).toBe('Plans unavailable');
  });
});

function createProduct(overrides: Partial<Product>): Product {
  return {
    id: 1,
    name: 'Orange Phone',
    description: 'A flagship phone',
    price: 39999,
    stockQuantity: 8,
    imageUrl: '/assets/phone.png',
    categoryId: 1,
    ...overrides,
  };
}

function createProductConfigure(
  overrides: Partial<ProductConfigure>,
): ProductConfigure {
  const product = createProduct(overrides);

  return {
    ...product,
    features: overrides.features ?? [],
    whatsInTheBox: overrides.whatsInTheBox ?? [],
    optionGroups: overrides.optionGroups ?? [],
    variants:
      overrides.variants ??
      [
        createProductVariant({
          id: product.id * 1000 + 1,
          price: product.price,
          stockQuantity: product.stockQuantity,
        }),
      ],
  };
}

function createProductVariant(
  overrides: Partial<ProductVariant>,
): ProductVariant {
  return {
    id: 1001,
    sku: 'orange-phone-1001',
    price: 39999,
    stockQuantity: 8,
    stockStatus: 'inStock',
    imageUrl: '/assets/phone.png',
    options: {},
    ...overrides,
  };
}

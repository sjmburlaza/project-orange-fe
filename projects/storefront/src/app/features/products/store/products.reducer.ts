import { createFeature, createReducer, on } from '@ngrx/store';
import { Category } from '@orange/core/models';
import {
  InsurancePlan,
  MobilePlan,
  Product,
  ProductConfigure,
  ProductSort,
} from '@orange/core/models';
import { ProductActions } from 'src/app/features/products/store/products.actions';

export const productFeatureKey = 'products';

export interface ProductState {
  products: Product[];
  productConfigures: Record<number, ProductConfigure>;
  insurancePlans: Record<number, InsurancePlan[]>;
  mobilePlans: Record<number, MobilePlan[]>;
  selectedProductId: number | null;

  categories: Category[];

  search: string | null;
  selectedCategoryId: number | null;
  selectedSort: ProductSort | null;
  minPrice: number | null;
  maxPrice: number | null;
  priceFilterMax: number | null;

  loadingProducts: boolean;
  loadingProductConfigure: boolean;
  loadingInsurancePlans: Record<number, boolean>;
  loadingMobilePlans: Record<number, boolean>;
  loadingCategories: boolean;

  productsError: string | null;
  productConfigureError: string | null;
  insurancePlansError: Record<number, string | null>;
  mobilePlansError: Record<number, string | null>;
  categoriesError: string | null;
}

export const initialState: ProductState = {
  products: [],
  productConfigures: {},
  insurancePlans: {},
  mobilePlans: {},
  selectedProductId: null,

  categories: [],

  search: null,
  selectedCategoryId: null,
  selectedSort: null,
  minPrice: null,
  maxPrice: null,
  priceFilterMax: null,

  loadingProducts: false,
  loadingProductConfigure: false,
  loadingInsurancePlans: {},
  loadingMobilePlans: {},
  loadingCategories: false,

  productsError: null,
  productConfigureError: null,
  insurancePlansError: {},
  mobilePlansError: {},
  categoriesError: null,
};

const reducer = createReducer(
  initialState,

  // LOAD PRODUCTS
  on(ProductActions.loadProducts, (state) => ({
    ...state,
    loadingProducts: true,
    productsError: null,
  })),

  on(ProductActions.loadProductsSuccess, (state, { products, filters }) => ({
    ...state,
    products,
    priceFilterMax: isBaseProductListRequest(filters)
      ? getProductsMaxPrice(products)
      : state.priceFilterMax,
    loadingProducts: false,
    productsError: null,
  })),

  on(ProductActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loadingProducts: false,
    productsError: error,
  })),

  // LOAD CATEGORIES
  on(ProductActions.loadCategories, (state) => ({
    ...state,
    loadingCategories: true,
    categoriesError: null,
  })),

  on(ProductActions.loadCategoriesSuccess, (state, { categories }) => ({
    ...state,
    categories,
    loadingCategories: false,
    categoriesError: null,
  })),

  on(ProductActions.loadCategoriesFailure, (state, { error }) => ({
    ...state,
    loadingCategories: false,
    categoriesError: error,
  })),

  // SELECT CATEGORY
  on(ProductActions.selectCategory, (state, { categoryId }) => ({
    ...state,
    selectedCategoryId: categoryId,
  })),

  on(ProductActions.selectSearch, (state, { search }) => ({
    ...state,
    search,
  })),

  on(ProductActions.selectSort, (state, { sortBy }) => ({
    ...state,
    selectedSort: sortBy,
  })),

  on(ProductActions.setPriceFilter, (state, { minPrice, maxPrice }) => ({
    ...state,
    minPrice,
    maxPrice,
  })),

  on(ProductActions.clearProductFilters, (state) => ({
    ...state,
    search: null,
    selectedCategoryId: null,
    selectedSort: null,
    minPrice: null,
    maxPrice: null,
  })),

  // LOAD PRODUCT CONFIGURE
  on(ProductActions.loadProductConfigure, (state, { id }) => ({
    ...state,
    selectedProductId: id,
    loadingProductConfigure: true,
    productConfigureError: null,
  })),

  on(ProductActions.loadProductConfigureSuccess, (state, { product }) => ({
    ...state,
    productConfigures: {
      ...state.productConfigures,
      [product.id]: product,
    },
    selectedProductId: product.id,
    loadingProductConfigure: false,
    productConfigureError: null,
  })),

  on(ProductActions.loadProductConfigureFailure, (state, { error }) => ({
    ...state,
    loadingProductConfigure: false,
    productConfigureError: error,
  })),

  // LOAD PRODUCT INSURANCE PLANS
  on(ProductActions.loadProductInsurancePlans, (state, { productId }) => ({
    ...state,
    loadingInsurancePlans: {
      ...state.loadingInsurancePlans,
      [productId]: true,
    },
    insurancePlansError: {
      ...state.insurancePlansError,
      [productId]: null,
    },
  })),

  on(
    ProductActions.loadProductInsurancePlansSuccess,
    (state, { productId, plans }) => ({
      ...state,
      insurancePlans: {
        ...state.insurancePlans,
        [productId]: plans,
      },
      loadingInsurancePlans: {
        ...state.loadingInsurancePlans,
        [productId]: false,
      },
      insurancePlansError: {
        ...state.insurancePlansError,
        [productId]: null,
      },
    }),
  ),

  on(
    ProductActions.loadProductInsurancePlansFailure,
    (state, { productId, error }) => ({
      ...state,
      loadingInsurancePlans: {
        ...state.loadingInsurancePlans,
        [productId]: false,
      },
      insurancePlansError: {
        ...state.insurancePlansError,
        [productId]: error,
      },
    }),
  ),

  // LOAD PRODUCT MOBILE PLANS
  on(ProductActions.loadProductMobilePlans, (state, { productId }) => ({
    ...state,
    loadingMobilePlans: {
      ...state.loadingMobilePlans,
      [productId]: true,
    },
    mobilePlansError: {
      ...state.mobilePlansError,
      [productId]: null,
    },
  })),

  on(
    ProductActions.loadProductMobilePlansSuccess,
    (state, { productId, plans }) => ({
      ...state,
      mobilePlans: {
        ...state.mobilePlans,
        [productId]: plans,
      },
      loadingMobilePlans: {
        ...state.loadingMobilePlans,
        [productId]: false,
      },
      mobilePlansError: {
        ...state.mobilePlansError,
        [productId]: null,
      },
    }),
  ),

  on(
    ProductActions.loadProductMobilePlansFailure,
    (state, { productId, error }) => ({
      ...state,
      loadingMobilePlans: {
        ...state.loadingMobilePlans,
        [productId]: false,
      },
      mobilePlansError: {
        ...state.mobilePlansError,
        [productId]: error,
      },
    }),
  ),

  // SELECT PRODUCT
  on(ProductActions.selectProduct, (state, { id }) => ({
    ...state,
    selectedProductId: id,
  })),

  // CLEAR SELECTION
  on(ProductActions.clearSelectedProduct, (state) => ({
    ...state,
    selectedProductId: null,
    productConfigureError: null,
  })),
);

export const productFeature = createFeature({
  name: productFeatureKey,
  reducer,
});

function isBaseProductListRequest(
  filters?: Partial<{
    search: string | null;
    categoryId: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  }>,
): boolean {
  return (
    !filters?.search &&
    !filters?.categoryId &&
    filters?.minPrice == null &&
    filters?.maxPrice == null
  );
}

function getProductsMaxPrice(products: Product[]): number {
  return products.reduce(
    (maxPrice, product) => Math.max(maxPrice, product.price),
    0,
  );
}

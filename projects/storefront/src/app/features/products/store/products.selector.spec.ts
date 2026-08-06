import {
  InsurancePlan,
  MobilePlan,
  Product,
  ProductConfigure,
  ProductVariant,
} from '@orange/core/models';
import {
  selectInsurancePlansForProduct,
  selectMobilePlansForProduct,
  selectProductFilters,
  selectSelectedProductConfigure,
} from './products.selector';

describe('product selectors', () => {
  it('projects the selected product filters into an API-ready filter object', () => {
    expect(
      selectProductFilters.projector('keyboard', 3, 'name-asc', 1000, 5000),
    ).toEqual({
      search: 'keyboard',
      categoryId: 3,
      sortBy: 'name-asc',
      minPrice: 1000,
      maxPrice: 5000,
    });
  });

  it('returns the selected product configure data from the configure cache', () => {
    const selectedProduct = createProductConfigure({
      id: 2,
      name: 'Selected Phone',
    });
    const configures: Record<number, ProductConfigure> = {
      1: createProductConfigure({ id: 1, name: 'Other Phone' }),
      2: selectedProduct,
    };

    expect(selectSelectedProductConfigure.projector(configures, 2)).toEqual(
      selectedProduct,
    );
    expect(selectSelectedProductConfigure.projector(configures, null)).toBeNull();
    expect(selectSelectedProductConfigure.projector(configures, 999)).toBeNull();
  });

  it('reads product add-on plans by product id', () => {
    const insurancePlans: Record<number, InsurancePlan[]> = {
      1: [
        {
          name: 'Screen protection',
          code: 'screen-protect',
          description: 'Accidental damage protection',
          amount: 499,
        },
      ],
    };
    const mobilePlans: Record<number, MobilePlan[]> = {
      1: [
        {
          name: 'Starter data plan',
          code: 'starter-data',
          amount: 999,
          dataAllowance: '10GB',
          description: 'A starter monthly data bundle',
        },
      ],
    };

    expect(selectInsurancePlansForProduct(1).projector(insurancePlans)).toEqual(
      insurancePlans[1],
    );
    expect(selectInsurancePlansForProduct(2).projector(insurancePlans)).toEqual(
      [],
    );
    expect(selectMobilePlansForProduct(1).projector(mobilePlans)).toEqual(
      mobilePlans[1],
    );
    expect(selectMobilePlansForProduct(2).projector(mobilePlans)).toEqual([]);
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { ProductConfigure } from '@orange/core/models';
import { AnalyticsService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import { ProductActions } from 'src/app/features/products/store/products.actions';
import providers from 'src/test-providers';

import { ProductConfiguratorComponent } from './product-configurator.component';

describe('ProductConfiguratorComponent', () => {
  let component: ProductConfiguratorComponent;
  let fixture: ComponentFixture<ProductConfiguratorComponent>;
  let store: Store;
  let cartFacade: CartFacade;
  let analytics: AnalyticsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductConfiguratorComponent],
      providers,
    }).compileComponents();

    store = TestBed.inject(Store);
    cartFacade = TestBed.inject(CartFacade);
    analytics = TestBed.inject(AnalyticsService);
    vi.spyOn(cartFacade, 'addToCart');
    vi.spyOn(analytics, 'trackAddToCart').mockImplementation(() => undefined);

    fixture = TestBed.createComponent(ProductConfiguratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes an available variant and handles option and quantity changes', () => {
    const product = createProduct();

    store.dispatch(ProductActions.loadProductConfigureSuccess({ product }));

    expect(component.selectedVariant?.id).toBe(1002);
    expect(component.selectedOptions).toEqual({ color: 'blue' });
    expect(component.isOptionSelected('color', 'blue')).toBe(true);
    expect(component.isOptionAvailable(product, 'color', 'red')).toBe(false);
    expect(component.isOptionAvailable(product, 'color', 'blue')).toBe(true);

    component.selectOption(product, 'color', { code: 'red', label: 'Red' });
    expect(component.selectedOptions).toEqual({ color: 'blue' });

    component.selectOption(product, 'color', { code: 'BLUE', label: 'Blue' });
    expect(component.selectedVariant?.id).toBe(1002);
    expect(component.getStockQuantity(product)).toBe(3);
    expect(component.getStockStatus(product)).toBe('lowStock');
    expect(component.getQuantityMax(product)).toBe(3);

    component.onQuantityChange(2);
    expect(component.canAddToCart(product)).toBe(true);
    component.addToCart(product);

    expect(analytics.trackAddToCart).toHaveBeenCalledWith(product, 2);
    expect(cartFacade.addToCart).toHaveBeenCalledWith({
      variantId: 1002,
      quantity: 2,
      addons: [],
    });

    component.onQuantityChange(4);
    expect(component.canAddToCart(product)).toBe(false);
    component.selectedVariant = null;
    component.addToCart(product);
    expect(cartFacade.addToCart).toHaveBeenCalledTimes(1);
  });

  it('uses product stock fallbacks and default options without variants', () => {
    const product = createProduct({
      id: 2,
      stockStatus: 'outOfStock',
      stockQuantity: 0,
      variants: [],
      optionGroups: [
        {
          code: 'color',
          label: 'Color',
          options: [{ code: 'red', label: 'Red' }],
        },
        { code: 'storage', label: 'Storage', options: [] },
      ],
    });

    store.dispatch(ProductActions.loadProductConfigureSuccess({ product }));

    expect(component.selectedVariant).toBeNull();
    expect(component.selectedOptions).toEqual({ color: 'red' });
    expect(component.getStockQuantity(product)).toBe(0);
    expect(component.getStockStatus(product)).toBe('outOfStock');
    expect(component.getQuantityMax(product)).toBe(1);

    const inStockFallback = createProduct({
      id: 3,
      stockStatus: undefined,
      stockQuantity: 1,
    });
    component.selectedVariant = null;
    expect(component.getStockStatus(inStockFallback)).toBe('inStock');
  });
});

function createProduct(
  overrides: Partial<ProductConfigure> = {},
): ProductConfigure {
  return {
    id: 1,
    name: 'Orange Phone',
    description: 'A configurable phone.',
    price: 39999,
    stockStatus: 'inStock',
    stockQuantity: 3,
    imageUrl: '/assets/phone.png',
    categoryId: 1,
    categoryName: 'Phones',
    features: [],
    whatsInTheBox: [],
    optionGroups: [
      {
        code: 'color',
        label: 'Color',
        options: [
          { code: 'red', label: 'Red' },
          { code: 'blue', label: 'Blue' },
        ],
      },
    ],
    variants: [
      {
        id: 1001,
        sku: 'orange-red',
        price: 39999,
        stockQuantity: 0,
        stockStatus: 'outOfStock',
        options: { color: 'red' },
      },
      {
        id: 1002,
        sku: 'orange-blue',
        price: 39999,
        stockQuantity: 3,
        stockStatus: 'lowStock',
        options: { color: 'blue' },
      },
    ],
    ...overrides,
  };
}

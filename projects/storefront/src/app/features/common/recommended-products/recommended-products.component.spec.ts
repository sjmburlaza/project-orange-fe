import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { Cart } from '@orange/core/models';
import {
  ProductConfigure,
  ProductVariant,
} from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import { vi } from 'vitest';

import { RecommendedProductsComponent } from './recommended-products.component';

describe('RecommendedProductsComponent', () => {
  let component: RecommendedProductsComponent;
  let fixture: ComponentFixture<RecommendedProductsComponent>;
  let cartFacade: {
    recommendedProducts$: BehaviorSubject<ProductConfigure[]>;
    cart$: BehaviorSubject<Cart | null>;
    loadRecommendedProducts: ReturnType<typeof vi.fn>;
    addToCart: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    cartFacade = {
      recommendedProducts$: new BehaviorSubject<ProductConfigure[]>([]),
      cart$: new BehaviorSubject<Cart | null>(null),
      loadRecommendedProducts: vi.fn(),
      addToCart: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RecommendedProductsComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: CartFacade,
          useValue: cartFacade,
        },
        {
          provide: SiteService,
          useValue: {
            currency: () => 'USD',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendedProductsComponent);
    component = fixture.componentInstance;
  });

  it('shows three recommended products at once', () => {
    cartFacade.recommendedProducts$.next([
      createProduct({ id: 1, name: 'One' }),
      createProduct({ id: 2, name: 'Two' }),
      createProduct({ id: 3, name: 'Three' }),
      createProduct({ id: 4, name: 'Four' }),
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('.recommended-product-card').length).toBe(3);
    expect(element.textContent).toContain('One');
    expect(element.textContent).toContain('Three');
    expect(element.textContent).not.toContain('Four');
  });

  it('adds the selected configured variant to cart', () => {
    const product = createProduct({
      id: 1,
      optionGroups: [
        {
          code: 'color',
          label: 'Color',
          options: [
            { code: 'black', label: 'Black', hex: '#111111' },
            { code: 'blue', label: 'Blue', hex: '#2563eb' },
          ],
        },
      ],
      variants: [
        createVariant({ id: 1001, options: { color: 'black' } }),
        createVariant({ id: 1002, options: { color: 'blue' } }),
      ],
    });

    cartFacade.recommendedProducts$.next([product]);
    fixture.detectChanges();
    component.selectOption(product, 'color', product.optionGroups[0].options[1]);
    component.addProduct(product);

    expect(cartFacade.addToCart).toHaveBeenCalledWith({
      variantId: 1002,
      quantity: 1,
      addons: [],
    });
  });

  it('renders selectable catalog-style color swatches', () => {
    const product = createProduct({
      id: 1,
      optionGroups: [
        {
          code: 'color',
          label: 'Available colors:',
          options: [
            { code: 'black', label: 'Black', hex: '#111111' },
            { code: 'blue', label: 'Blue', hex: '#2563eb' },
          ],
        },
      ],
      variants: [
        createVariant({ id: 1001, options: { color: 'black' } }),
        createVariant({ id: 1002, options: { color: 'blue' } }),
      ],
    });

    cartFacade.recommendedProducts$.next([product]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const blackSwatch = element.querySelector<HTMLButtonElement>(
      '.recommended-option--color[aria-label="Black"]',
    );
    const blueSwatch = element.querySelector<HTMLButtonElement>(
      '.recommended-option--color[aria-label="Blue"]',
    );

    expect(blackSwatch?.getAttribute('aria-pressed')).toBe('true');
    expect(blackSwatch?.textContent?.trim()).toBe('');
    expect(blueSwatch?.style.backgroundColor).toBe('rgb(37, 99, 235)');

    blueSwatch?.click();
    fixture.detectChanges();

    expect(
      element
        .querySelector<HTMLButtonElement>(
          '.recommended-option--color[aria-label="Blue"]',
        )
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('refreshes recommended products when cart contents change', () => {
    fixture.detectChanges();

    cartFacade.cart$.next(createCart({ quantity: 1 }));
    cartFacade.cart$.next(createCart({ quantity: 1 }));
    cartFacade.cart$.next(createCart({ quantity: 2 }));

    expect(cartFacade.loadRecommendedProducts).toHaveBeenCalledTimes(2);
  });
});

function createProduct(
  overrides: Partial<ProductConfigure>,
): ProductConfigure {
  const id = overrides.id ?? 1;

  return {
    id,
    name: 'Orange Watch',
    description: 'A compact wearable',
    price: 12999,
    stockQuantity: 6,
    imageUrl: '',
    categoryId: 3,
    categoryName: 'Accessories',
    features: [],
    whatsInTheBox: [],
    optionGroups: [],
    variants: [createVariant({ id: id * 1000 + 1 })],
    ...overrides,
  };
}

function createVariant(
  overrides: Partial<ProductVariant>,
): ProductVariant {
  return {
    id: 1001,
    sku: 'orange-watch-1001',
    price: 12999,
    stockQuantity: 6,
    stockStatus: 'inStock',
    imageUrl: '',
    options: {},
    ...overrides,
  };
}

function createCart(overrides: { quantity: number }): Cart {
  return {
    code: 'cart-123',
    entries: [
      {
        productId: 1,
        variantId: 1001,
        productName: 'Orange Watch',
        price: 12999,
        quantity: overrides.quantity,
        totalPrice: 12999 * overrides.quantity,
        stockQuantity: 6,
        imageUrl: '',
        itemSpecs: [],
        addons: [],
      },
    ],
    appliedVouchers: [],
    cartSummary: [],
  };
}

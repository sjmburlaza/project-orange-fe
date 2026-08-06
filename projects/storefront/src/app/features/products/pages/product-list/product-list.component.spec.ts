import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, of } from 'rxjs';

import { Product } from '@orange/core/models';
import { ProductActions } from 'src/app/features/products/store/products.actions';
import { ProductListComponent } from './product-list.component';
import providers from 'src/test-providers';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let store: Store;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    dialog = {
      open: vi.fn(() => ({
        afterClosed: () => of('cancel'),
      })),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        ...providers,
        {
          provide: MatDialog,
          useValue: dialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds sort options for the product toolbar', () => {
    expect(component.sortOptions).toEqual([
      { label: 'Price: Low to High', value: 'price-asc' },
      { label: 'Price: High to Low', value: 'price-desc' },
      { label: 'Name: A to Z', value: 'name-asc' },
      { label: 'Name: Z to A', value: 'name-desc' },
    ]);
  });

  it('builds category options for the product toolbar', async () => {
    store.dispatch(
      ProductActions.loadCategoriesSuccess({
        categories: [
          { id: 1, name: 'Phones' },
          { id: 2, name: 'Laptops' },
        ],
      }),
    );

    expect(await firstValueFrom(component.categoryOptions$)).toEqual([
      { label: 'Phones', value: 1 },
      { label: 'Laptops', value: 2 },
    ]);
  });

  it('selects a category and keeps it in the URL', async () => {
    const navigate = vi.spyOn(router, 'navigate');
    store.dispatch(
      ProductActions.loadCategoriesSuccess({
        categories: [{ id: 3, name: 'Mobile Phones' }],
      }),
    );

    component.onCategoryChange(3);

    expect(await firstValueFrom(component.selectedCategoryId$)).toBe(3);
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { category: 'mobile-phones' },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('builds price slider state from product filter state', async () => {
    store.dispatch(
      ProductActions.loadProductsSuccess({
        products: [createProduct({ price: 39999 })],
        filters: {},
      }),
    );

    expect(await firstValueFrom(component.priceMax$)).toBe(39999);
    expect(await firstValueFrom(component.priceRange$)).toEqual({
      min: 0,
      max: 39999,
    });

    store.dispatch(
      ProductActions.setPriceFilter({
        minPrice: 1000,
        maxPrice: 50000,
      }),
    );

    expect(await firstValueFrom(component.priceMax$)).toBe(50000);
    expect(await firstValueFrom(component.priceRange$)).toEqual({
      min: 1000,
      max: 50000,
    });
  });

  it('detects active filters for the filtered empty state', async () => {
    expect(await firstValueFrom(component.hasActiveProductFilters$)).toBe(false);

    store.dispatch(ProductActions.selectCategory({ categoryId: 3 }));

    expect(await firstValueFrom(component.hasActiveProductFilters$)).toBe(true);
  });

  it('prompts guests to sign in before saving a product', () => {
    const navigate = vi.spyOn(router, 'navigate');
    dialog.open.mockReturnValue({
      afterClosed: () => of('proceed'),
    });

    component.toggleWishlist(createProduct(), false);

    expect(dialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          title: 'products.wishlistAuth.title',
          message: 'products.wishlistAuth.message',
          cancel: 'products.wishlistAuth.cancel',
          proceed: 'products.wishlistAuth.proceed',
        },
      }),
    );
    expect(navigate).toHaveBeenCalledWith(
      ['/', component.siteService.currentSite(), 'auth', 'login'],
      {
        queryParams: { returnUrl: router.url },
      },
    );
  });
});

function createProduct(overrides: Partial<Product> = {}): Product {
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

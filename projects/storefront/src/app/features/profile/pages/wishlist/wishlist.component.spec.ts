import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WishlistProductSummary } from '@orange/core/models';
import { of } from 'rxjs';
import { WishlistService } from 'src/app/features/profile/services/wishlist.service';
import providers from 'src/test-providers';

import { WishlistComponent } from './wishlist.component';

describe('WishlistComponent', () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;
  let loadWishlist: ReturnType<typeof vi.fn>;
  let removeProduct: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadWishlist = vi.fn();
    removeProduct = vi.fn();
    const wishlistService = {
      wishlist$: of({ count: 0, items: [] }),
      loading$: of(false),
      error$: of(null),
      mutatingProductIds$: of(new Set<number>()),
      loadWishlist,
      removeProduct,
    };

    await TestBed.configureTestingModule({
      imports: [WishlistComponent],
      providers: [
        ...providers,
        {
          provide: WishlistService,
          useValue: wishlistService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WishlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the wishlist on init', () => {
    expect(loadWishlist).toHaveBeenCalled();
  });

  it('reloads, removes products, and navigates to product destinations', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const site = component.siteService.currentSite();

    component.reload();
    component.removeProduct(42);
    component.configureProduct(42);
    component.viewProduct(42);
    component.continueShopping();

    expect(loadWishlist).toHaveBeenCalledTimes(2);
    expect(removeProduct).toHaveBeenCalledWith(42);
    expect(navigate).toHaveBeenNthCalledWith(1, [
      '/',
      site,
      'products',
      42,
      'configure',
    ]);
    expect(navigate).toHaveBeenNthCalledWith(2, [
      '/',
      site,
      'products',
      42,
    ]);
    expect(navigate).toHaveBeenNthCalledWith(3, ['/', site, 'products']);
  });

  it('uses explicit stock status before falling back to quantity', () => {
    expect(component.getStockStatus(createProduct('lowStock', 0))).toBe(
      'lowStock',
    );
    expect(component.getStockStatus(createProduct(undefined, 2))).toBe(
      'inStock',
    );
    expect(component.getStockStatus(createProduct(undefined, 0))).toBe(
      'outOfStock',
    );
  });
});

function createProduct(
  stockStatus: WishlistProductSummary['stockStatus'],
  stockQuantity: number,
): WishlistProductSummary {
  return {
    id: 42,
    name: 'Orange Phone',
    description: 'A saved phone.',
    price: 39999,
    stockStatus,
    stockQuantity,
    imageUrl: '/assets/phone.png',
    categoryId: 1,
    itemSpecs: [],
    availableColors: [],
  };
}

import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WishlistResponse } from '@orange/core/models';
import { firstValueFrom } from 'rxjs';

import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  let service: WishlistService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WishlistService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the wishlist and updates its derived state', async () => {
    const wishlist = createWishlist();
    let loading = false;
    service.loading$.subscribe((value) => {
      loading = value;
    });

    expect(await firstValueFrom(service.count$)).toBe(0);
    expect([...(await firstValueFrom(service.productIds$))]).toEqual([]);

    service.loadWishlist();
    expect(loading).toBe(true);

    const request = http.expectOne('/api/wishlist');
    expect(request.request.method).toBe('GET');
    request.flush(wishlist);

    expect(loading).toBe(false);
    expect(await firstValueFrom(service.wishlist$)).toEqual(wishlist);
    expect(await firstValueFrom(service.count$)).toBe(1);
    expect([...(await firstValueFrom(service.productIds$))]).toEqual([42]);
  });

  it('reports a load error and clears all local state', async () => {
    service.loadWishlist();
    http.expectOne('/api/wishlist').flush('Failure', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(await firstValueFrom(service.error$)).toBe('wishlist.error.load');

    service.clear();
    expect(await firstValueFrom(service.wishlist$)).toBeNull();
    expect(await firstValueFrom(service.loading$)).toBe(false);
    expect(await firstValueFrom(service.error$)).toBeNull();
    expect([...(await firstValueFrom(service.mutatingProductIds$))]).toEqual([]);
  });

  it('checks whether an individual product is wishlisted', () => {
    service.checkProductStatus(42).subscribe((status) => {
      expect(status).toEqual({ productId: 42, isWishlisted: true });
    });

    const request = http.expectOne('/api/wishlist/items/42');
    expect(request.request.method).toBe('GET');
    request.flush({ productId: 42, isWishlisted: true });
  });

  it('adds and removes products through toggle while tracking mutations', async () => {
    const wishlist = createWishlist();

    service.toggleProduct(42, false);
    expect([...(await firstValueFrom(service.mutatingProductIds$))]).toEqual([
      42,
    ]);

    const addRequest = http.expectOne('/api/wishlist/items');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ productId: 42 });
    addRequest.flush(wishlist);

    expect([...(await firstValueFrom(service.mutatingProductIds$))]).toEqual([]);
    expect(await firstValueFrom(service.wishlist$)).toEqual(wishlist);

    service.toggleProduct(42, true);
    expect([...(await firstValueFrom(service.mutatingProductIds$))]).toEqual([
      42,
    ]);

    const removeRequest = http.expectOne('/api/wishlist/items/42');
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush({ count: 0, items: [] });

    expect([...(await firstValueFrom(service.mutatingProductIds$))]).toEqual([]);
    expect(await firstValueFrom(service.count$)).toBe(0);
  });

  it('exposes add and remove request failures', async () => {
    service.addProduct(42);
    http.expectOne('/api/wishlist/items').flush('Failure', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(await firstValueFrom(service.error$)).toBe('wishlist.error.add');

    service.removeProduct(42);
    http.expectOne('/api/wishlist/items/42').flush('Failure', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(await firstValueFrom(service.error$)).toBe('wishlist.error.remove');
  });
});

function createWishlist(): WishlistResponse {
  return {
    count: 1,
    items: [
      {
        id: 7,
        productId: 42,
        addedAtUtc: '2026-08-20T00:00:00Z',
        product: {
          id: 42,
          name: 'Orange Phone',
          description: 'A saved phone.',
          price: 39999,
          stockStatus: 'inStock',
          stockQuantity: 4,
          imageUrl: '/assets/phone.png',
          categoryId: 1,
          itemSpecs: [],
          availableColors: [],
        },
      },
    ],
  };
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import {
  AddWishlistItemRequest,
  WishlistResponse,
  WishlistStatus,
} from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/wishlist';

  private readonly wishlistSubject = new BehaviorSubject<WishlistResponse | null>(
    null,
  );
  private readonly loadingSubject = new BehaviorSubject(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly mutatingProductIdsSubject = new BehaviorSubject<Set<number>>(
    new Set(),
  );

  readonly wishlist$ = this.wishlistSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly mutatingProductIds$ = this.mutatingProductIdsSubject.asObservable();
  readonly count$ = this.wishlist$.pipe(map((wishlist) => wishlist?.count ?? 0));
  readonly productIds$ = this.wishlist$.pipe(
    map(
      (wishlist) =>
        new Set(wishlist?.items.map((item) => item.productId) ?? []),
    ),
  );

  loadWishlist(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http
      .get<WishlistResponse>(this.baseUrl)
      .pipe(
        finalize(() => {
          this.loadingSubject.next(false);
        }),
      )
      .subscribe({
        next: (wishlist) => {
          this.wishlistSubject.next(wishlist);
        },
        error: () => {
          this.errorSubject.next('wishlist.error.load');
        },
      });
  }

  checkProductStatus(productId: number): Observable<WishlistStatus> {
    return this.http.get<WishlistStatus>(`${this.baseUrl}/items/${productId}`);
  }

  toggleProduct(productId: number, isWishlisted: boolean): void {
    if (isWishlisted) {
      this.removeProduct(productId);
      return;
    }

    this.addProduct(productId);
  }

  addProduct(productId: number): void {
    this.setProductMutating(productId, true);
    this.errorSubject.next(null);
    const request: AddWishlistItemRequest = { productId };

    this.http
      .post<WishlistResponse>(`${this.baseUrl}/items`, request)
      .pipe(
        finalize(() => {
          this.setProductMutating(productId, false);
        }),
      )
      .subscribe({
        next: (wishlist) => {
          this.wishlistSubject.next(wishlist);
        },
        error: () => {
          this.errorSubject.next('wishlist.error.add');
        },
      });
  }

  removeProduct(productId: number): void {
    this.setProductMutating(productId, true);
    this.errorSubject.next(null);

    this.http
      .delete<WishlistResponse>(`${this.baseUrl}/items/${productId}`)
      .pipe(
        finalize(() => {
          this.setProductMutating(productId, false);
        }),
      )
      .subscribe({
        next: (wishlist) => {
          this.wishlistSubject.next(wishlist);
        },
        error: () => {
          this.errorSubject.next('wishlist.error.remove');
        },
      });
  }

  clear(): void {
    this.wishlistSubject.next(null);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
    this.mutatingProductIdsSubject.next(new Set());
  }

  private setProductMutating(productId: number, isMutating: boolean): void {
    const productIds = new Set(this.mutatingProductIdsSubject.value);

    if (isMutating) {
      productIds.add(productId);
    } else {
      productIds.delete(productId);
    }

    this.mutatingProductIdsSubject.next(productIds);
  }
}

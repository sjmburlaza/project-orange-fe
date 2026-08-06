import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AddToCartRequest,
  ApplyVoucherRequest,
  Cart,
  UpdateCartShippingRequest,
  UpdateCartItemAddonRequest,
  UpdateQuantityRequest,
} from '@orange/core/models';
import { ProductConfigure } from '@orange/core/models';
import { BrowserStorageService } from '@orange/core/services';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly browserStorage = inject(BrowserStorageService);
  private readonly baseUrl = '/api/carts';
  private readonly cartCodeKey = 'cartCode';

  getCart(): Observable<Cart | null> {
    const cartCode = this.getCartCode();

    if (!cartCode) {
      return of(null);
    }

    return this.http.get<Cart>(`${this.baseUrl}/${cartCode}`);
  }

  addToCart(request: AddToCartRequest): Observable<Cart> {
    const cartCode = this.getCartCode();

    const url = cartCode
      ? `${this.baseUrl}/${cartCode}/items`
      : `${this.baseUrl}/items`;

    return this.http.post<Cart>(url, request);
  }

  updateQuantity(
    variantId: number,
    request: UpdateQuantityRequest,
  ): Observable<Cart> {
    const cartCode = this.requireCartCode();

    return this.http.put<Cart>(
      `${this.baseUrl}/${cartCode}/items/${variantId}`,
      request,
    );
  }

  removeItem(variantId: number): Observable<Cart> {
    const cartCode = this.requireCartCode();

    return this.http.delete<Cart>(
      `${this.baseUrl}/${cartCode}/items/${variantId}`,
    );
  }

  upsertItemAddon(
    variantId: number,
    addonId: string,
    request: UpdateCartItemAddonRequest,
  ): Observable<Cart> {
    const cartCode = this.requireCartCode();
    const encodedAddonId = encodeURIComponent(addonId);

    return this.http.put<Cart>(
      `${this.baseUrl}/${cartCode}/items/${variantId}/addons/${encodedAddonId}`,
      request,
    );
  }

  removeItemAddon(variantId: number, addonId: string): Observable<Cart> {
    const cartCode = this.requireCartCode();
    const encodedAddonId = encodeURIComponent(addonId);

    return this.http.delete<Cart>(
      `${this.baseUrl}/${cartCode}/items/${variantId}/addons/${encodedAddonId}`,
    );
  }

  applyVoucher(request: ApplyVoucherRequest): Observable<Cart> {
    const cartCode = this.requireCartCode();

    return this.http.post<Cart>(
      `${this.baseUrl}/${cartCode}/vouchers`,
      request,
    );
  }

  removeVoucher(code: string): Observable<Cart> {
    const cartCode = this.requireCartCode();
    const voucherCode = encodeURIComponent(code);

    return this.http.delete<Cart>(
      `${this.baseUrl}/${cartCode}/vouchers/${voucherCode}`,
    );
  }

  updateShipping(request: UpdateCartShippingRequest): Observable<Cart> {
    const cartCode = this.requireCartCode();

    return this.http.put<Cart>(`${this.baseUrl}/${cartCode}/shipping`, request);
  }

  getRecommendedProducts(): Observable<ProductConfigure[]> {
    const cartCode = this.getCartCode();

    if (!cartCode) {
      return of([]);
    }

    return this.http.get<ProductConfigure[]>(
      `${this.baseUrl}/${cartCode}/recommended-products`,
    );
  }

  saveCartCode(cartCode: string): void {
    this.browserStorage.setItem(this.cartCodeKey, cartCode);
  }

  clearCartCode(): void {
    this.browserStorage.removeItem(this.cartCodeKey);
  }

  private getCartCode(): string | null {
    return this.browserStorage.getItem(this.cartCodeKey);
  }

  private requireCartCode(): string {
    const cartCode = this.getCartCode();

    if (!cartCode) {
      throw new Error('Cart has not been created yet.');
    }

    return cartCode;
  }
}

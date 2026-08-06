import { Product, ProductOption, ProductSpec } from './product.model';

export interface WishlistProductSummary extends Product {
  itemSpecs: ProductSpec[];
  availableColors: ProductOption[];
}

export interface WishlistItem {
  id: number;
  productId: number;
  addedAtUtc: string;
  product: WishlistProductSummary;
}

export interface WishlistResponse {
  count: number;
  items: WishlistItem[];
}

export interface WishlistStatus {
  productId: number;
  isWishlisted: boolean;
}

export interface AddWishlistItemRequest {
  productId: number;
}

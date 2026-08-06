import { Category } from './category.model';
import { Addon } from './cart.model';

export type StockStatus = 'inStock' | 'lowStock' | 'outOfStock';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockStatus?: StockStatus;
  stockQuantity: number;
  imageUrl: string;
  categoryId: number;
  categoryName?: string;
  subcategoryName?: string;
  availableColors?: ProductOption[];
  reviewRating?: number;
  reviewCount?: number;
}

export interface ProductConfigure extends Product {
  category?: Category;
  features: string[];
  whatsInTheBox: string[];
  optionGroups: ProductOptionGroup[];
  variants: ProductVariant[];
}

export interface ProductSpec {
  name: string;
  value: string;
}

export interface ProductOptionGroup {
  code: string;
  label: string;
  options: ProductOption[];
}

export interface ProductOption {
  code: string;
  label: string;
  price?: number;
  hex?: string;
  imageUrl?: string;
}

export interface ProductOptionAvailability extends ProductOption {
  available: boolean;
}

export interface ProductOptionAvailabilityGroup extends Omit<
  ProductOptionGroup,
  'options'
> {
  options: ProductOptionAvailability[];
}

export interface ProductOptionsResponse {
  selectedOptions: Record<string, string>;
  optionGroups: ProductOptionAvailabilityGroup[];
}

export interface ProductVariant {
  id: number;
  sku: string;
  price: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  imageUrl?: string;
  options: Record<string, string>;
}

export interface InsurancePlan {
  name: string;
  code: string;
  description: string;
  amount: number;
  billingFrequency?: string;
}

export interface MobilePlan {
  name: string;
  code: string;
  amount: number;
  billingFrequency?: string;
  dataAllowance: string;
  description: string;
}

export type ProductSort = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export interface ProductFilters {
  search: string | null;
  categoryId: number | null;
  sortBy: ProductSort | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export type ProductAddon = Addon;

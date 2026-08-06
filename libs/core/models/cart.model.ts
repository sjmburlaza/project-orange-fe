export interface Cart {
  code: string;
  entries: CartItem[];
  appliedVouchers: Voucher[];
  cartSummary: CartSummaryAttribute[];
}

export interface CartItem {
  productId: number;
  variantId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  stockQuantity: number;
  imageUrl: string;
  categoryName?: string;
  subcategoryName?: string;
  itemSpecs: ItemSpec[];
  addons: Addon[];
}

export interface ItemSpec {
  name: string;
  value: string;
}

export interface Addon {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  isAdded: boolean;
  amount?: number;
  billingFrequency?: string;
}

export interface Voucher {
  code: string;
  name: string;
  description: string;
}

export interface CartSummaryAttribute {
  name: string;
  amount: number;
  billingFrequency?: string;
  displayValue?: number | string;
}

export interface AddonSelectionRequest {
  insurancePlanCode?: string | null;
  mobilePlanCode?: string | null;
  tradeInSessionId?: string | null;
}

export interface AddToCartRequest extends AddonSelectionRequest {
  variantId: number;
  quantity: number;
  addons: Addon[];
}

export type UpdateCartItemAddonRequest = AddonSelectionRequest;

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface ApplyVoucherRequest {
  code: string;
}

export interface UpdateCartShippingRequest {
  postalCode: string;
  shippingMethodCode: string;
}

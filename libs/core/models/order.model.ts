import { Addon, Cart, ItemSpec } from './cart.model';

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'refunded'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export interface OrderProductItem {
  productId: number;
  productName: string;
  price: number;
  totalPrice: number;
  quantity: number;
  imageUrl: string;
  categoryName?: string;
  subcategoryName?: string;
  itemSpecs: ItemSpec[];
  addons?: Addon[];
}

export interface OrderShippingAddress {
  recipientName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string;
  barangay?: string;
  city?: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id?: string;
  orderNumber: string;
  customerEmail?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  items: OrderProductItem[];
  shippingAddress: OrderShippingAddress;
  deliveryEstimate: string;
  deliveredAt?: string;
  trackingNumber?: string;
  courier?: string;
  invoiceUrl?: string;
  subtotalAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  nextSteps: string[];
  placedAt: string;
}

export type OrderConfirmation = OrderItem;

export interface PlaceOrderRequest {
  checkoutData: Record<string, Record<string, unknown>>;
  cart: Cart | null;
}

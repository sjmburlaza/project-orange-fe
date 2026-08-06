import type { Category } from '@orange/core/models';
import type {
  Cart,
  CartItem,
  Voucher,
} from '@orange/core/models';
import type { CheckoutFormConfig } from '@orange/core/models';
import type {
  Product,
  ProductConfigure,
  ProductVariant,
  StockStatus,
} from '@orange/core/models';
import type { FulfillmentOption } from '../../projects/storefront/src/app/features/checkout/services/fulfillment.service';

export const categories: Category[] = [
  { id: 1, name: 'Phones' },
  { id: 2, name: 'Laptops' },
  { id: 4, name: 'Monitors' },
  { id: 3, name: 'Accessories' },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'iPhone 15',
    description: 'Apple smartphone',
    price: 59999,
    stockQuantity: 10,
    imageUrl: '',
    categoryId: 1,
    categoryName: 'Phones',
    availableColors: [
      { code: 'black', label: 'Black', hex: '#111111' },
      { code: 'blue', label: 'Blue', hex: '#2563eb' },
    ],
  },
  {
    id: 2,
    name: 'MacBook Air M5',
    description: 'Lightweight laptop with M5 chip',
    price: 72990,
    stockQuantity: 5,
    imageUrl: '',
    categoryId: 2,
    categoryName: 'Laptops',
    availableColors: [
      { code: 'midnight', label: 'Midnight', hex: '#1f2937' },
      { code: 'starlight', label: 'Starlight', hex: '#f5e6cc' },
    ],
  },
  {
    id: 4,
    name: 'Orange Studio Monitor',
    description: '27-inch 4K display',
    price: 24999,
    stockQuantity: 8,
    imageUrl: '',
    categoryId: 4,
    categoryName: 'Monitors',
    availableColors: [
      { code: 'silver', label: 'Silver', hex: '#d1d5db' },
      { code: 'black', label: 'Black', hex: '#111111' },
    ],
  },
  {
    id: 3,
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard',
    price: 3500,
    stockQuantity: 25,
    imageUrl: '',
    categoryId: 3,
    categoryName: 'Accessories',
    availableColors: [
      { code: 'black', label: 'Black', hex: '#111111' },
      { code: 'white', label: 'White', hex: '#ffffff' },
    ],
  },
];

export const productConfigures: ProductConfigure[] = products.map((product) =>
  createProductConfigure(product),
);

export const checkoutForm: CheckoutFormConfig = {
  version: 'e2e',
  steps: [
    {
      id: 'customer',
      label: 'Customer Details',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          validators: ['required', 'email'].map((name) => ({ name })),
        },
        {
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          validators: [{ name: 'required' }],
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Last Name',
          validators: [{ name: 'required' }],
        },
        {
          name: 'mobileNumber',
          type: 'text',
          label: 'Mobile Number',
          validators: [{ name: 'required' }],
        },
        {
          name: 'deliveryAddress',
          type: 'group',
          label: 'Delivery Address',
          fields: [
            {
              name: 'street',
              type: 'text',
              label: 'Street',
              validators: [{ name: 'required' }],
            },
            {
              name: 'city',
              type: 'text',
              label: 'City',
              validators: [{ name: 'required' }],
            },
            {
              name: 'postalCode',
              type: 'text',
              label: 'Postal Code',
              validators: [{ name: 'required' }],
            },
          ],
        },
      ],
    },
    {
      id: 'shipping',
      label: 'Shipping',
      fields: [
        {
          name: 'shippingMethod',
          type: 'select',
          label: 'Shipping Method',
        },
      ],
    },
    {
      id: 'payment',
      label: 'Payment',
      fields: [
        {
          name: 'paymentMethod',
          type: 'select',
          label: 'Payment Method',
          options: [
            { label: 'Credit Card', value: 'card', icon: 'credit_card' },
            { label: 'Cash on Delivery', value: 'cod', icon: 'payments' },
          ],
        },
      ],
    },
  ],
};

export const fulfillmentOptions: FulfillmentOption[] = [
  {
    code: 'jnt-standard',
    type: 'delivery',
    courierCode: 'jnt',
    courierName: 'J&T Express',
    label: 'Standard Delivery',
    price: 120,
    estimatedAvailability: '2–4 business days',
  },
  {
    code: 'lbc-express',
    type: 'delivery',
    courierCode: 'lbc',
    courierName: 'LBC Express',
    label: 'Express Delivery',
    price: 180,
    estimatedAvailability: '1–2 business days',
  },
  {
    code: 'pickup-sm-megamall',
    type: 'pickup',
    pickupLocationId: 'sm-megamall',
    pickupLocationName: 'SM Megamall Pickup Point',
    pickupAddress: 'Mandaluyong City',
    label: 'Pick up in store',
    price: 0,
    estimatedAvailability: 'Ready in 1–2 days',
  },
];

export const save10Voucher: Voucher = {
  code: 'SAVE10',
  name: 'Save 10',
  description: 'E2E discount',
};

export function createCart(
  entries: CartItem[] = [createCartItem(products[0], 1)],
  appliedVouchers: Voucher[] = [],
): Cart {
  const subtotal = entries.reduce(
    (total, entry) => total + entry.price * entry.quantity,
    0,
  );
  const discount = appliedVouchers.length ? 5000 : 0;
  const total = Math.max(subtotal - discount, 0);

  return {
    code: 'e2e-cart',
    entries,
    appliedVouchers,
    cartSummary: [
      { name: 'Subtotal', amount: subtotal },
      ...(discount
        ? [{ name: 'Voucher Discount', amount: -discount }]
        : []),
      { name: 'Total', amount: total },
    ],
  };
}

export function createCartItem(
  product: Product,
  quantity: number,
  variantId = product.id * 1000 + 1,
): CartItem {
  return {
    productId: product.id,
    variantId,
    productName: product.name,
    price: product.price,
    quantity,
    totalPrice: product.price * quantity,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    categoryName: product.categoryName,
    itemSpecs: [],
    addons: [],
  };
}

function createProductConfigure(product: Product): ProductConfigure {
  if (product.id === 1) {
    const optionGroups = [
      {
        code: 'color',
        label: 'Color',
        options: [
          { code: 'black', label: 'Black', hex: '#111111' },
          { code: 'blue', label: 'Blue', hex: '#2563eb' },
        ],
      },
      {
        code: 'storage',
        label: 'Storage',
        options: [
          { code: '128gb', label: '128GB' },
          { code: '256gb', label: '256GB' },
        ],
      },
    ];
    const variants: ProductVariant[] = [
      createVariant(product, 1001, 59999, 10, {
        color: 'black',
        storage: '128gb',
      }),
      createVariant(product, 1002, 59999, 3, {
        color: 'blue',
        storage: '128gb',
      }),
      createVariant(product, 1003, 69999, 2, {
        color: 'black',
        storage: '256gb',
      }),
      createVariant(product, 1004, 69999, 0, {
        color: 'blue',
        storage: '256gb',
      }),
    ];

    return {
      ...product,
      category: { id: product.categoryId, name: product.categoryName ?? '' },
      features: [
        'iPhone 15 with unlocked connectivity',
        'All-day battery for everyday use',
        'Advanced camera system',
        'Fast USB-C charging support',
      ],
      whatsInTheBox: ['iPhone 15', 'USB-C charge cable', 'Documentation'],
      optionGroups,
      variants,
    };
  }

  return {
    ...product,
    category: { id: product.categoryId, name: product.categoryName ?? '' },
    features: [],
    whatsInTheBox: [],
    optionGroups: [],
    variants: [
      createVariant(product, product.id * 1000 + 1, product.price, product.stockQuantity),
    ],
  };
}

function createVariant(
  product: Product,
  id: number,
  price: number,
  stockQuantity: number,
  options: Record<string, string> = {},
): ProductVariant {
  return {
    id,
    sku: `${product.id}-${id}`,
    price,
    stockQuantity,
    stockStatus: getStockStatus(stockQuantity),
    imageUrl: product.imageUrl,
    options,
  };
}

function getStockStatus(stockQuantity: number): StockStatus {
  if (stockQuantity <= 0) {
    return 'outOfStock';
  }

  return stockQuantity <= 5 ? 'lowStock' : 'inStock';
}

import { CartItem, CartSummaryAttribute } from '@orange/core/models';
import {
  selectCartItemCount,
  selectCartItems,
  selectRecommendedProducts,
  selectCartTotal,
} from './cart.selector';

describe('cart selectors', () => {
  it('returns an empty item list when no cart exists', () => {
    expect(selectCartItems.projector(null)).toEqual([]);
  });

  it('sums cart quantities across all line items', () => {
    const items: CartItem[] = [
      createCartItem({ productId: 1, quantity: 2 }),
      createCartItem({ productId: 2, quantity: 3 }),
    ];

    expect(selectCartItemCount.projector(items)).toBe(5);
  });

  it('reads the total amount from the cart summary', () => {
    const summary: CartSummaryAttribute[] = [
      { name: 'Subtotal', amount: 1000 },
      { name: 'Discount', amount: -100 },
      { name: 'Total', amount: 900 },
    ];

    expect(selectCartTotal.projector(summary)).toBe(900);
  });

  it('falls back to zero when the cart summary has no total row', () => {
    expect(selectCartTotal.projector([{ name: 'Subtotal', amount: 1000 }])).toBe(
      0,
    );
  });

  it('exposes recommended products from cart state', () => {
    const products = [
      {
        id: 2,
        name: 'Orange Watch',
        description: 'A compact wearable',
        price: 12999,
        stockQuantity: 6,
        imageUrl: '/assets/watch.png',
        categoryId: 3,
        categoryName: 'Accessories',
        features: [],
        whatsInTheBox: [],
        optionGroups: [],
        variants: [
          {
            id: 2001,
            sku: 'orange-watch-2001',
            price: 12999,
            stockQuantity: 6,
            stockStatus: 'inStock' as const,
            imageUrl: '/assets/watch.png',
            options: {},
          },
        ],
      },
    ];

    expect(selectRecommendedProducts.projector({
      cart: null,
      recommendedProducts: products,
      loading: false,
      loadingRecommendedProducts: false,
      error: null,
      recommendedProductsError: null,
      voucherError: null,
    })).toEqual(products);
  });
});

function createCartItem(overrides: Partial<CartItem>): CartItem {
  return {
    productId: 1,
    variantId: 1001,
    productName: 'Orange Phone',
    price: 39999,
    quantity: 1,
    totalPrice: 39999,
    stockQuantity: 8,
    imageUrl: '/assets/phone.png',
    itemSpecs: [],
    addons: [],
    ...overrides,
  };
}

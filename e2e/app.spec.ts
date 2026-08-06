import { expect, test, type Page, type Route } from '@playwright/test';
import { PERMISSIONS, ROLES } from '@orange/core/models';
import type { AuthSession } from '@orange/core/models';
import type { AnalyticsDashboard } from '@orange/core/models';
import type {
  AddToCartRequest,
  ApplyVoucherRequest,
  Cart,
  CartItem,
  UpdateQuantityRequest,
} from '@orange/core/models';
import type {
  OrderConfirmation,
  PaymentStatus,
  PlaceOrderRequest,
} from '@orange/core/models';
import type { SiteConfig } from '@orange/core/i18n';
import type { ProductSort } from '@orange/core/models';
import {
  categories,
  checkoutForm,
  createCart,
  createCartItem,
  fulfillmentOptions,
  productConfigures,
  products,
  save10Voucher,
} from './fixtures/catalog';

const adminBaseUrl =
  process.env['E2E_ADMIN_BASE_URL'] ?? 'http://localhost:4301';
const sitePreferenceKey = 'orange.sitePreference';
const siteConfigs: SiteConfig[] = [
  {
    code: 'ph',
    countryName: 'Philippines',
    locale: 'en-PH',
    currency: 'PHP',
    defaultLanguage: 'en',
    supportedLanguages: ['en'],
    features: {
      insurance: true,
      tradeIn: false,
      vouchers: true,
    },
  },
  {
    code: 'fr',
    countryName: 'France',
    locale: 'fr-FR',
    currency: 'EUR',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr'],
    features: {
      insurance: true,
      tradeIn: true,
      vouchers: true,
    },
  },
  {
    code: 'cn',
    countryName: 'China',
    locale: 'zh-CN',
    currency: 'CNY',
    defaultLanguage: 'zh',
    supportedLanguages: ['zh'],
    features: {
      insurance: true,
      tradeIn: true,
      vouchers: true,
    },
  },
  {
    code: 'jp',
    countryName: 'Japan',
    locale: 'ja-JP',
    currency: 'JPY',
    defaultLanguage: 'ja',
    supportedLanguages: ['ja'],
    features: {
      insurance: true,
      tradeIn: true,
      vouchers: true,
    },
  },
];

test.describe('routing and catalog', () => {
  test.beforeEach(async ({ page }) => {
    await mockOrangeApi(page);
  });

  test('suggests a supported detected country and enters the selected site', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Choose your country' }),
    ).toBeVisible();
    await expect(
      page.getByText('We found Philippines from your connection.'),
    ).toBeVisible();

    await page.getByRole('button', { name: /Continue to Philippines/ }).click();

    await expect(page).toHaveURL(/\/ph$/);
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), sitePreferenceKey),
      )
      .toBe('ph');
    await expect(
      page.getByRole('heading', { name: 'ORANGE', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Upgrade your everyday.' }),
    ).toBeVisible();
  });

  test('uses a saved country preference when visiting the root URL', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, site }: { key: string; site: string }) => {
        localStorage.setItem(key, site);
      },
      { key: sitePreferenceKey, site: 'jp' },
    );

    await page.goto('/');

    await expect(page).toHaveURL(/\/jp$/);
    await expect(
      page.getByRole('heading', { name: '毎日を、アップグレード。' }),
    ).toBeVisible();
  });

  test('keeps valid country URLs authoritative over a saved preference', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, site }: { key: string; site: string }) => {
        localStorage.setItem(key, site);
      },
      { key: sitePreferenceKey, site: 'jp' },
    );

    await page.goto('/fr/products');

    await expect(page).toHaveURL(/\/fr\/products$/);
    await expect(
      page.locator('app-header').getByRole('link', { name: 'Boutique' }),
    ).toBeVisible();
    await expect(productCard(page, 'iPhone 15')).toBeVisible();
  });

  test('shows the selector for an unsupported detected country', async ({
    page,
  }) => {
    await mockGeoCountry(page, 'KR');
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Choose your country' }),
    ).toBeVisible();
    await expect(
      page.getByText('Orange is not available in KR yet.'),
    ).toBeVisible();

    await page.getByRole('button', { name: /Japan/ }).click();

    await expect(page).toHaveURL(/\/jp$/);
    await expect(
      page.getByRole('heading', { name: '毎日を、アップグレード。' }),
    ).toBeVisible();
  });

  test('shows the selector when country detection fails', async ({ page }) => {
    await mockGeoError(page);
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Choose your country' }),
    ).toBeVisible();
    await expect(page.getByText(/We found/)).toHaveCount(0);

    await page.getByRole('button', { name: /France/ }).click();

    await expect(page).toHaveURL(/\/fr$/);
    await expect(
      page.getByRole('heading', { name: 'Améliorez votre quotidien.' }),
    ).toBeVisible();
  });

  test('routes unsupported site codes through the country selector', async ({
    page,
  }) => {
    await mockGeoCountry(page, 'KR');
    await page.goto('/unknown/products');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'Choose your country' }),
    ).toBeVisible();

    await page.getByRole('button', { name: /China/ }).click();

    await expect(page).toHaveURL(/\/cn$/);
    await expect(
      page.getByRole('heading', { name: '升级你的每一天。' }),
    ).toBeVisible();
  });

  test('filters products by category', async ({ page }) => {
    await page.goto('/ph/products');

    const categoryFilter = page.locator('.filter-category mat-select');

    await categoryFilter.click();
    await page.getByRole('option', { name: 'Phones' }).click();

    await expect(page).toHaveURL(/\/ph\/products\?category=phones$/);
    await expect(productNames(page)).toHaveText(['iPhone 15']);

    await categoryFilter.click();
    await page.getByRole('option', { name: 'Accessories' }).click();

    await expect(page).toHaveURL(/\/ph\/products\?category=accessories$/);
    await expect(productNames(page)).toHaveText(['Mechanical Keyboard']);

    await categoryFilter.click();
    await page.getByRole('option', { name: 'Monitors' }).click();

    await expect(page).toHaveURL(/\/ph\/products\?category=monitors$/);
    await expect(productNames(page)).toHaveText(['Orange Studio Monitor']);

    await categoryFilter.click();
    await page.getByRole('option', { name: 'All Categories' }).click();

    await expect(page).toHaveURL(/\/ph\/products$/);
    await expect(productNames(page)).toHaveText([
      'iPhone 15',
      'MacBook Air M5',
      'Orange Studio Monitor',
      'Mechanical Keyboard',
    ]);
  });

  test('sorts products by price in both directions', async ({ page }) => {
    await page.goto('/ph/products');

    await page.locator('.filter-sort mat-select').click();
    await page.getByRole('option', { name: 'Price: Low to High' }).click();

    await expect(productNames(page)).toHaveText([
      'Mechanical Keyboard',
      'Orange Studio Monitor',
      'iPhone 15',
      'MacBook Air M5',
    ]);

    await page.locator('.filter-sort mat-select').click();
    await page.getByRole('option', { name: 'Price: High to Low' }).click();

    await expect(productNames(page)).toHaveText([
      'MacBook Air M5',
      'iPhone 15',
      'Orange Studio Monitor',
      'Mechanical Keyboard',
    ]);
  });

  test('adds a product to cart and shows the confirmation dialog', async ({
    page,
  }) => {
    await page.goto('/ph/products');

    await productCard(page, 'iPhone 15')
      .getByRole('button', { name: 'Buy' })
      .click();
    await expect(page).toHaveURL(/\/ph\/products\/1\/configure$/);
    await page
      .locator('.product-configurator__purchase')
      .getByRole('button', { name: 'Buy' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Added to Cart' }),
    ).toBeVisible();
    await expect(
      page.getByText('Item has been added to your cart.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to Cart' })).toBeVisible();
  });

  test('keeps the product image sticky until the configurator reaches the footer', async ({
    page,
  }) => {
    await page.goto('/ph/products/1/configure');

    const media = page.locator('.product-configurator__media');
    await expect(media).toBeVisible();

    const stickyTop = await media.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).top),
    );

    await page.evaluate(() => {
      const configurator = document.querySelector('.product-configurator');
      const configuratorTop =
        window.scrollY + (configurator?.getBoundingClientRect().top ?? 0);

      window.scrollTo(0, configuratorTop + 160);
    });

    await expect
      .poll(() =>
        media.evaluate((element) =>
          Math.round(element.getBoundingClientRect().top),
        ),
      )
      .toBe(Math.round(stickyTop));

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const boundary = await page.evaluate(() => {
      const mediaRect = document
        .querySelector('.product-configurator__media')
        ?.getBoundingClientRect();
      const configuratorRect = document
        .querySelector('.product-configurator')
        ?.getBoundingClientRect();
      const footerRect = document
        .querySelector('app-footer')
        ?.getBoundingClientRect();

      return {
        mediaBottom: mediaRect?.bottom ?? Number.POSITIVE_INFINITY,
        configuratorBottom:
          configuratorRect?.bottom ?? Number.NEGATIVE_INFINITY,
        footerTop: footerRect?.top ?? Number.NEGATIVE_INFINITY,
      };
    });

    expect(boundary.mediaBottom).toBeLessThanOrEqual(
      boundary.configuratorBottom + 1,
    );
    expect(boundary.mediaBottom).toBeLessThan(boundary.footerTop);
  });
});

test.describe('cart journey', () => {
  test.beforeEach(async ({ page }) => {
    await mockOrangeApi(page);
  });

  test('opens the cart, updates quantity, applies a voucher, and enters checkout', async ({
    page,
  }) => {
    await addIphoneToCart(page);

    await page.getByRole('button', { name: 'Go to Cart' }).click();

    await expect(page).toHaveURL(/\/ph\/cart$/);
    await expect(page.getByRole('heading', { name: 'iPhone 15' })).toBeVisible();
    const cartItem = page.locator('app-cart-item').filter({ hasText: 'iPhone 15' });
    await expect(cartItem.getByText('In Stock')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Checkout as guest' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'You may also like' }),
    ).toBeVisible();
    await expect(
      page.locator('app-recommended-products .recommended-product-card'),
    ).toHaveCount(3);
    await expect(
      page
        .locator('app-recommended-products .recommended-product-card')
        .filter({ hasText: 'MacBook Air M5' }),
    ).toBeVisible();

    await cartItem.locator('.quantity-btn').last().click();

    await expect(cartItem.locator('.quantity-input')).toHaveValue('2');
    await expect(page.locator('app-order-summary .total__value')).toContainText(
      '119,998.00',
    );

    await page.getByPlaceholder('Enter Voucher Code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByText('SAVE10')).toBeVisible();
    await expect(page.getByText('Voucher Discount')).toBeVisible();

    await page
      .locator('.applied-vouchers__item')
      .filter({ hasText: 'SAVE10' })
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(page.getByText('SAVE10')).toHaveCount(0);
    await expect(page.getByText('Voucher Discount')).toHaveCount(0);

    await page.getByRole('button', { name: 'Checkout as guest' }).click();

    await expect(page).toHaveURL(/\/ph\/checkout$/);
    await expect(page.getByText('Customer Details')).toBeVisible();
  });

  test('removes the only cart item and shows the empty cart state', async ({
    page,
  }) => {
    await addIphoneToCart(page);

    await page.getByRole('button', { name: 'Go to Cart' }).click();
    await page
      .locator('app-cart-item')
      .filter({ hasText: 'iPhone 15' })
      .getByRole('button', { name: 'Remove' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });
});

test.describe('auth journey', () => {
  test.beforeEach(async ({ page }) => {
    await mockOrangeApi(page);
  });

  test('shows required validation errors on empty login submit', async ({
    page,
  }) => {
    await page.goto('/ph/auth/login');

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
  });
});

test.describe('order lookup', () => {
  const lookupOrder = createLookupOrder();

  test.beforeEach(async ({ page }) => {
    await mockOrangeApi(page, { orders: [lookupOrder] });
  });

  test('validates the lookup form and displays a matching order', async ({
    page,
  }) => {
    await page.goto('/ph/orders');

    await expect(
      page.getByRole('heading', { name: 'Find your order' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Search order' }).click();

    await expect(page.getByText('Order number is required.')).toBeVisible();
    await expect(page.getByText('Email address is required.')).toBeVisible();

    await page.getByLabel('Order number').fill(lookupOrder.orderNumber);
    await page.getByLabel('Email address').fill('wrong@example.com');
    await page.getByRole('button', { name: 'Search order' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      /This order doesn't exist\./,
    );

    await page.getByLabel('Email address').fill('ada@example.com');
    await page.getByRole('button', { name: 'Search order' }).click();

    await expect(
      page.getByText(`Order #${lookupOrder.orderNumber}`),
    ).toBeVisible();
    await expect(page.getByText('Shipped')).toBeVisible();

    await page.getByText(`Order #${lookupOrder.orderNumber}`).click();

    await expect(page.getByText('iPhone 15')).toBeVisible();
    await expect(page.getByText('Tracking: TRK-ORANGE-0007')).toBeVisible();
    await expect(page.getByText('Courier: Orange Express')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Track Package' }),
    ).toBeVisible();
  });
});

test.describe('admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockOrangeApi(page, {
      authSession: createAdminSession(),
      dashboard: (period) =>
        createAnalyticsDashboard(
          period === 'past-year'
            ? {
                visitors: 15000,
                productViews: 42000,
                revenue: 2400000,
              }
            : undefined,
        ),
    });
  });

  test('loads admin analytics and refreshes the selected period', async ({
    page,
  }) => {
    await page.goto(`${adminBaseUrl}/admin/analytics`);

    await expect(page).toHaveURL(/\/admin\/analytics$/);
    await expect(
      page.getByRole('heading', { name: 'Analytics Dashboard' }),
    ).toBeVisible();
    const metrics = page.getByLabel('Analytics metrics');

    await expect(
      page.getByText('Admin Analytics', { exact: true }),
    ).toBeVisible();
    await expect(metrics.getByText('1,200')).toBeVisible();
    await expect(metrics.getByText('3,400')).toBeVisible();
    await expect(metrics.getByText('84 completed orders')).toBeVisible();

    const periodSelect = page.getByRole('combobox', { name: 'Period' });

    await periodSelect.click();
    await page.getByRole('option', { name: 'Past year' }).click();

    await expect(periodSelect).toContainText('Past year');
    await expect(metrics.getByText('15,000')).toBeVisible();
    await expect(metrics.getByText('42,000')).toBeVisible();

    await page.getByRole('tab', { name: 'Orders' }).click();

    await expect(
      page.getByRole('heading', { name: 'Recent Orders' }),
    ).toBeVisible();
    await expect(
      page.locator('.data-table--orders').getByText('OR-20260618-0007'),
    ).toBeVisible();
    await expect(
      page.locator('.data-table--orders').getByText('96'),
    ).toBeVisible();
  });
});

test.describe('checkout journey', () => {
  test.beforeEach(async ({ page }) => {
    await mockOrangeApi(page);
  });

  test('blocks progress until required customer details are valid', async ({
    page,
  }) => {
    await startCheckout(page);

    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Invalid Email')).toBeVisible();
    await expect(page.getByText('Invalid First Name')).toBeVisible();
    await expect(page.getByText('Invalid Last Name')).toBeVisible();
    await expect(page.getByText('Invalid Postal Code')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Choose your fulfillment option' }),
    ).toHaveCount(0);
  });

  test('completes customer, shipping, payment, and place-order steps', async ({
    page,
  }) => {
    await startCheckout(page);
    await fillCustomerDetails(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Next' }).click();

    await expect(
      page.getByRole('heading', { name: 'Choose your fulfillment option' }),
    ).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(
      page.getByRole('button', { name: /Pick up in store/ }),
    ).toHaveCount(0);
    await page.getByRole('tab', { name: 'Pickup' }).click();
    await expect(
      page.getByRole('button', { name: /Pick up in store/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Standard Delivery/ }),
    ).toHaveCount(0);
    await page.getByRole('tab', { name: 'Delivery' }).click();

    await page.getByRole('button', { name: /Standard Delivery/ }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(
      page.getByRole('heading', { name: 'Choose payment method' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Credit Card/ }).click();
    await expect(page.getByLabel('Name on card')).toBeVisible();
    await page.getByLabel('Name on card').fill('Ada Lovelace');
    await page.getByLabel('Card number').fill('4242 4242 4242 1111');
    await page.getByLabel('MM/YY').fill('12/30');
    await page.getByLabel('CVV').fill('123');
    await page
      .getByRole('checkbox', {
        name: /I have read, understand and agree to the Terms of Service/,
      })
      .check();
    await page.getByRole('button', { name: 'Place Order' }).click();

    await expect(page).toHaveURL(/\/ph\/orders\/confirmation\/OR-\d{8}-\d{4}$/);
    await expect(
      page.getByRole('heading', { name: 'Order confirmed' }),
    ).toBeVisible();
    await expect(page.getByText(/Order number OR-\d{8}-\d{4}/)).toBeVisible();
    await expect(page.getByText('Paid', { exact: true })).toBeVisible();
    await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
    await expect(page.getByText('iPhone 15')).toBeVisible();
    await expect(page.getByText('Ada Lovelace')).toBeVisible();
    await expect(page.getByText('123 Orange Avenue')).toBeVisible();
    await expect(page.getByText('2–4 business days')).toBeVisible();
    await expect(page.getByText('Total amount')).toBeVisible();
    await expect(
      page.getByText('Your payment has been processed successfully.'),
    ).toBeVisible();
  });
});

function productCard(page: Page, name: string) {
  return page.locator('app-product-card').filter({ hasText: name });
}

function productNames(page: Page) {
  return page.locator('app-product-card .product__name');
}

async function addIphoneToCart(page: Page): Promise<void> {
  await page.goto('/ph/products');

  await productCard(page, 'iPhone 15')
    .getByRole('button', { name: 'Buy' })
    .click();
  await expect(page).toHaveURL(/\/ph\/products\/1\/configure$/);
  await page
    .locator('.product-configurator__purchase')
    .getByRole('button', { name: 'Buy' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Added to Cart' }),
  ).toBeVisible();
}

async function startCheckout(page: Page): Promise<void> {
  await addIphoneToCart(page);
  await page.getByRole('button', { name: 'Go to Cart' }).click();
  await page.getByRole('button', { name: 'Checkout as guest' }).click();

  await expect(page).toHaveURL(/\/ph\/checkout$/);
  await expect(page.getByText('Customer Details')).toBeVisible();
}

async function fillCustomerDetails(page: Page): Promise<void> {
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('First Name').fill('Ada');
  await page.getByLabel('Last Name').fill('Lovelace');
  await page.getByLabel('Mobile Number').fill('09171234567');
  await page.getByLabel('Street').fill('123 Orange Avenue');
  await page.getByLabel('City').fill('Manila');
  await page.getByLabel('Postal Code').fill('1000');
}

function createLookupOrder(): OrderConfirmation {
  return {
    id: 'lookup-order',
    orderNumber: 'OR-20260618-0007',
    customerEmail: 'ada@example.com',
    paymentStatus: 'paid',
    orderStatus: 'shipped',
    items: [createCartItem(products[0], 1)],
    shippingAddress: {
      recipientName: 'Ada Lovelace',
      mobileNumber: '09171234567',
      addressLine1: '123 Orange Avenue',
      city: 'Manila',
      postalCode: '1000',
      country: 'Philippines',
    },
    deliveryEstimate: '3-5 business days',
    trackingNumber: 'TRK-ORANGE-0007',
    courier: 'Orange Express',
    subtotalAmount: products[0].price,
    shippingAmount: 0,
    discountAmount: 0,
    totalAmount: products[0].price,
    nextSteps: ['We will notify you when the order starts processing.'],
    placedAt: '2026-06-18T00:00:00.000Z',
  };
}

function createAdminSession(): AuthSession {
  return {
    user: {
      id: 'admin-e2e',
      email: 'admin@example.com',
      fullName: 'Ada Admin',
      roles: [ROLES.ADMIN],
      permissions: [
        PERMISSIONS.ORDERS_READ,
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.USERS_READ,
      ],
    },
    session: {
      id: 'session-e2e',
      createdAtUtc: '2026-06-20T00:00:00.000Z',
      expiresAtUtc: '2026-06-21T00:00:00.000Z',
    },
  };
}

function createAnalyticsDashboard(
  overrides: Partial<AnalyticsDashboard> = {},
): AnalyticsDashboard {
  return {
    visitors: 1200,
    productViews: 3400,
    addToCarts: 420,
    checkoutStarts: 210,
    purchases: 84,
    revenue: 512000,
    averageOrderValue: 6095,
    addToCartRate: 0.1235,
    checkoutStartRate: 0.5,
    purchaseConversionRate: 0.07,
    cartAbandonmentRate: 0.8,
    paymentFailures: 3,
    paymentFailureRate: 0.0345,
    unitsSold: 96,
    daily: [
      {
        dateKey: '2026-06-18',
        label: 'Jun 18',
        visitors: 520,
        productViews: 1400,
        addToCarts: 180,
        checkoutStarts: 90,
        purchases: 36,
        revenue: 220000,
        paymentFailures: 1,
      },
      {
        dateKey: '2026-06-19',
        label: 'Jun 19',
        visitors: 680,
        productViews: 2000,
        addToCarts: 240,
        checkoutStarts: 120,
        purchases: 48,
        revenue: 292000,
        paymentFailures: 2,
      },
    ],
    funnel: [
      { label: 'Visitors', value: 1200, rateFromPrevious: 1, rateFromVisitors: 1 },
      {
        label: 'Product views',
        value: 3400,
        rateFromPrevious: 2.833,
        rateFromVisitors: 2.833,
      },
      {
        label: 'Add to cart',
        value: 420,
        rateFromPrevious: 0.1235,
        rateFromVisitors: 0.35,
      },
      {
        label: 'Checkout started',
        value: 210,
        rateFromPrevious: 0.5,
        rateFromVisitors: 0.175,
      },
      {
        label: 'Purchases',
        value: 84,
        rateFromPrevious: 0.4,
        rateFromVisitors: 0.07,
      },
    ],
    topProducts: [
      {
        productId: 1,
        productName: 'iPhone 15',
        categoryName: 'Phones',
        views: 1800,
        addToCarts: 260,
        unitsSold: 64,
        revenue: 383936,
        conversionRate: 0.0356,
      },
    ],
    topCategories: [
      {
        categoryName: 'Phones',
        views: 1800,
        addToCarts: 260,
        unitsSold: 64,
        revenue: 383936,
        conversionRate: 0.0356,
      },
    ],
    orders: [
      {
        orderNumber: 'OR-20260618-0007',
        occurredAt: '2026-06-18T10:30:00.000Z',
        items: [
          {
            productId: 1,
            productName: 'iPhone 15',
            categoryName: 'Phones',
            price: 59999,
            quantity: 1,
          },
        ],
        units: 96,
        revenue: 512000,
      },
    ],
    paymentFailureEvents: [
      {
        id: 'failure-e2e',
        occurredAt: '2026-06-19T10:30:00.000Z',
        amount: 59999,
        reason: 'Payment authorization timed out',
        items: [],
      },
    ],
    ...overrides,
  };
}

function resolveDashboard(
  dashboard: MockOrangeApiOptions['dashboard'],
  period: string,
): AnalyticsDashboard {
  if (typeof dashboard === 'function') {
    return dashboard(period) ?? createAnalyticsDashboard();
  }

  return dashboard ?? createAnalyticsDashboard();
}

async function mockOrangeApi(
  page: Page,
  options: MockOrangeApiOptions = {},
): Promise<void> {
  const state = {
    cart: createCart(),
    wishlistProductIds: new Set<number>(),
    orderSequence: 1,
    orders: new Map(
      (options.orders ?? []).map((order) => [order.orderNumber, order]),
    ),
  };

  await mockGeoCountry(page, 'PH');
  await mockSites(page);

  await page.route(/\/api\/(?:[a-z]{2}\/)?categories$/, async (route) => {
    await route.fulfill({ json: categories });
  });

  await page.route(
    /\/api\/(?:[a-z]{2}\/)?products(?:\?.*)?$/,
    async (route) => {
      const url = new URL(route.request().url());
      const categoryId = url.searchParams.get('categoryId');
      const sortBy = url.searchParams.get('sortBy') as ProductSort | null;
      const minPrice = Number(url.searchParams.get('minPrice') ?? 0);
      const maxPrice = Number(url.searchParams.get('maxPrice') ?? 100000);
      const filteredProducts = categoryId
        ? products.filter((product) => product.categoryId === Number(categoryId))
        : [...products];
      const visibleProducts = sortProducts(
        filteredProducts.filter(
          (product) => product.price >= minPrice && product.price <= maxPrice,
        ),
        sortBy,
      );

      await route.fulfill({ json: visibleProducts });
    },
  );

  await page.route(
    /\/api\/(?:[a-z]{2}\/)?products\/\d+$/,
    async (route) => {
      const productId = Number(new URL(route.request().url()).pathname.split('/').at(-1));
      const product = productConfigures.find((item) => item.id === productId);

      if (!product) {
        await route.fulfill({
          status: 404,
          json: { message: 'Product not found' },
        });
        return;
      }

      await route.fulfill({ json: product });
    },
  );

  await page.route(/\/api\/(?:[a-z]{2}\/)?carts(?:\/.*)?$/, async (route) => {
    await handleCartRoute(route, state);
  });

  await page.route(/\/api\/(?:[a-z]{2}\/)?wishlist(?:\/.*)?$/, async (route) => {
    await handleWishlistRoute(route, state);
  });

  await page.route(/\/api\/(?:[a-z]{2}\/)?orders(?:\/.*)?$/, async (route) => {
    await handleOrderRoute(route, state);
  });

  await page.route(/\/api\/(?:[a-z]{2}\/)?auth\/session$/, async (route) => {
    if (!options.authSession) {
      await route.fulfill({ status: 401, json: { message: 'Unauthenticated' } });
      return;
    }

    await route.fulfill({ json: options.authSession });
  });

  await page.route(
    /\/api\/(?:[a-z]{2}\/)?admin\/analytics\/dashboard(?:\?.*)?$/,
    async (route) => {
      const period =
        new URL(route.request().url()).searchParams.get('period') ??
        'last-7-days';

      await route.fulfill({ json: resolveDashboard(options.dashboard, period) });
    },
  );

  await page.route(
    /\/api\/(?:[a-z]{2}\/)?analytics\/events$/,
    async (route) => {
      await route.fulfill({
        status: 201,
        json: resolveDashboard(options.dashboard, 'last-7-days'),
      });
    },
  );

  await page.route(/\/api\/(?:[a-z]{2}\/)?checkout\/form$/, async (route) => {
    await route.fulfill({ json: checkoutForm });
  });

  await page.route(
    /\/api\/(?:[a-z]{2}\/)?fulfillment\/options(?:\?.*)?$/,
    async (route) => {
      await route.fulfill({ json: fulfillmentOptions });
    },
  );
}

interface MockOrangeApiOptions {
  authSession?: AuthSession | null;
  dashboard?:
    | AnalyticsDashboard
    | ((period: string) => AnalyticsDashboard | undefined);
  orders?: OrderConfirmation[];
}

async function mockSites(page: Page): Promise<void> {
  await page.route(/\/api\/sites$/, async (route) => {
    await route.fulfill({ json: { sites: siteConfigs } });
  });

  await page.route(/\/api\/sites\/[^/]+$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const siteCode = pathname.split('/').at(-1);
    const site = siteConfigs.find((config) => config.code === siteCode);

    if (!site) {
      await route.fulfill({
        status: 404,
        json: { message: 'Site not found' },
      });
      return;
    }

    await route.fulfill({ json: site });
  });
}

async function mockGeoCountry(
  page: Page,
  countryCode: string | null,
): Promise<void> {
  await page.route(/\/api\/geo\/country$/, async (route) => {
    await route.fulfill({ json: { countryCode } });
  });
}

async function mockGeoError(page: Page): Promise<void> {
  await page.route(/\/api\/geo\/country$/, async (route) => {
    await route.fulfill({ status: 500, json: { message: 'Not available' } });
  });
}

function sortProducts(productsToSort: typeof products, sortBy: ProductSort | null) {
  const sortedProducts = [...productsToSort];

  switch (sortBy) {
    case 'price-asc':
      return sortedProducts.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sortedProducts.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sortedProducts;
  }
}

async function handleCartRoute(
  route: Route,
  state: { cart: Cart },
): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  const pathname = apiPathname(url);
  const segments = pathname.split('/').filter(Boolean);
  const method = request.method();

  if (method === 'GET' && segments.at(-1) === 'recommended-products') {
    const cartProductIds = new Set(
      state.cart.entries.map((entry) => entry.productId),
    );
    const recommendedProducts = productConfigures
      .filter((product) => !cartProductIds.has(product.id))
      .slice(0, 3);

    await route.fulfill({ json: recommendedProducts });
    return;
  }

  if (method === 'GET' && segments.at(-1) === 'e2e-cart') {
    await route.fulfill({ json: state.cart });
    return;
  }

  if (method === 'POST' && segments.at(-1) === 'items') {
    const body = request.postDataJSON() as AddToCartRequest;
    const product = findProductByVariantId(body.variantId);

    if (!product) {
      await route.fulfill({ status: 404, json: { message: 'Product not found' } });
      return;
    }

    const cartItem = createCartItem(product, body.quantity, body.variantId);
    const entries =
      pathname === '/api/carts/items'
        ? [cartItem]
        : upsertCartItem(state.cart.entries, cartItem);

    state.cart = createCart(entries, state.cart.appliedVouchers);
    await route.fulfill({ json: state.cart });
    return;
  }

  if (method === 'PUT' && segments.at(-2) === 'items') {
    const variantId = Number(segments.at(-1));
    const body = request.postDataJSON() as UpdateQuantityRequest;

    state.cart = updateCartItemQuantity(state.cart, variantId, body.quantity);
    await route.fulfill({ json: state.cart });
    return;
  }

  if (
    (method === 'PUT' || method === 'DELETE') &&
    segments.at(-4) === 'items' &&
    segments.at(-2) === 'addons'
  ) {
    const variantId = Number(segments.at(-3));
    const addonId = decodeURIComponent(segments.at(-1) ?? '');

    state.cart = updateCartItemAddon(state.cart, variantId, addonId, method === 'PUT');
    await route.fulfill({ json: state.cart });
    return;
  }

  if (method === 'DELETE' && segments.at(-2) === 'items') {
    const variantId = Number(segments.at(-1));

    state.cart = createCart(
      state.cart.entries.filter((entry) => entry.variantId !== variantId),
      state.cart.appliedVouchers,
    );
    await route.fulfill({ json: state.cart });
    return;
  }

  if (method === 'POST' && segments.at(-1) === 'vouchers') {
    const body = request.postDataJSON() as ApplyVoucherRequest;
    const vouchers = body.code === save10Voucher.code ? [save10Voucher] : [];

    state.cart = createCart(state.cart.entries, vouchers);
    await route.fulfill({ json: state.cart });
    return;
  }

  if (method === 'DELETE' && segments.at(-2) === 'vouchers') {
    state.cart = createCart(state.cart.entries);
    await route.fulfill({ json: state.cart });
    return;
  }

  if (method === 'PUT' && segments.at(-1) === 'shipping') {
    await route.fulfill({ json: state.cart });
    return;
  }

  await route.fulfill({ status: 404, json: { message: 'Not mocked' } });
}

async function handleWishlistRoute(
  route: Route,
  state: { wishlistProductIds: Set<number> },
): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  const pathname = apiPathname(url);
  const segments = pathname.split('/').filter(Boolean);
  const method = request.method();

  if (method === 'GET' && pathname === '/api/wishlist') {
    await route.fulfill({ json: createWishlist(state.wishlistProductIds) });
    return;
  }

  if (method === 'POST' && segments.at(-1) === 'items') {
    const body = request.postDataJSON() as { productId: number };
    const product = products.find((item) => item.id === body.productId);

    if (!product) {
      await route.fulfill({ status: 404, json: { message: 'Product not found' } });
      return;
    }

    state.wishlistProductIds.add(body.productId);
    await route.fulfill({ json: createWishlist(state.wishlistProductIds) });
    return;
  }

  if (method === 'GET' && segments.at(-2) === 'items') {
    const productId = Number(segments.at(-1));

    await route.fulfill({
      json: {
        productId,
        isWishlisted: state.wishlistProductIds.has(productId),
      },
    });
    return;
  }

  if (method === 'DELETE' && segments.at(-2) === 'items') {
    const productId = Number(segments.at(-1));

    state.wishlistProductIds.delete(productId);
    await route.fulfill({ json: createWishlist(state.wishlistProductIds) });
    return;
  }

  await route.fulfill({ status: 404, json: { message: 'Not mocked' } });
}

function createWishlist(productIds: Set<number>) {
  const items = [...productIds]
    .map((productId) => products.find((product) => product.id === productId))
    .filter((product): product is (typeof products)[number] =>
      Boolean(product),
    )
    .map((product, index) => ({
      id: index + 1,
      productId: product.id,
      addedAtUtc: '2026-06-28T23:01:03+00:00',
      product: {
        ...product,
        itemSpecs: [],
        availableColors: product.availableColors ?? [],
      },
    }));

  return {
    count: items.length,
    items,
  };
}

function findProductByVariantId(variantId: number) {
  const configure = productConfigures.find((product) =>
    product.variants.some((variant) => variant.id === variantId),
  );

  return configure
    ? products.find((product) => product.id === configure.id)
    : undefined;
}

async function handleOrderRoute(
  route: Route,
  state: {
    cart: Cart;
    orderSequence: number;
    orders: Map<string, OrderConfirmation>;
  },
): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  const pathname = apiPathname(url);
  const segments = pathname.split('/').filter(Boolean);
  const method = request.method();

  if (method === 'GET' && pathname === '/api/orders') {
    await route.fulfill({ json: [...state.orders.values()] });
    return;
  }

  if (method === 'GET' && pathname === '/api/orders/lookup') {
    const orderNumber = url.searchParams.get('orderNumber') ?? '';
    const email = url.searchParams.get('email')?.toLowerCase();
    const order = state.orders.get(orderNumber);

    if (!orderNumber || !email || order?.customerEmail?.toLowerCase() !== email) {
      await route.fulfill({ status: 404, json: { message: 'Order not found' } });
      return;
    }

    await route.fulfill({ json: order });
    return;
  }

  if (method === 'GET' && segments.at(-2) === 'orders') {
    const orderNumber = decodeURIComponent(segments.at(-1) ?? '');
    const order = state.orders.get(orderNumber);
    const email = url.searchParams.get('email')?.toLowerCase();

    if (!order || (email && order.customerEmail?.toLowerCase() !== email)) {
      await route.fulfill({ status: 404, json: { message: 'Order not found' } });
      return;
    }

    await route.fulfill({ json: order });
    return;
  }

  if (method === 'POST' && pathname === '/api/orders') {
    const body = request.postDataJSON() as PlaceOrderRequest;
    const order = createOrderConfirmation(body, state.cart, state.orderSequence);

    state.orderSequence += 1;
    state.orders.set(order.orderNumber, order);
    await route.fulfill({ json: order });
    return;
  }

  await route.fulfill({ status: 404, json: { message: 'Not mocked' } });
}

function apiPathname(url: URL): string {
  const segments = url.pathname.split('/').filter(Boolean);

  if (segments[0] === 'api' && segments[1]?.length === 2) {
    return `/api/${segments.slice(2).join('/')}`;
  }

  return url.pathname;
}

function updateCartItemQuantity(
  cart: Cart,
  variantId: number,
  quantity: number,
): Cart {
  return createCart(
    cart.entries.map((entry) =>
      entry.variantId === variantId
        ? { ...entry, quantity, totalPrice: entry.price * quantity }
        : entry,
    ),
    cart.appliedVouchers,
  );
}

function upsertCartItem(entries: CartItem[], item: CartItem): CartItem[] {
  const existingItem = entries.find(
    (entry) => entry.variantId === item.variantId,
  );

  if (!existingItem) {
    return [...entries, item];
  }

  return entries.map((entry) =>
    entry.variantId === item.variantId
      ? {
          ...entry,
          quantity: entry.quantity + item.quantity,
          totalPrice: entry.price * (entry.quantity + item.quantity),
        }
      : entry,
  );
}

function updateCartItemAddon(
  cart: Cart,
  variantId: number,
  addonId: string,
  isAdded: boolean,
): Cart {
  return createCart(
    cart.entries.map((entry) =>
      entry.variantId === variantId
        ? {
            ...entry,
            addons: entry.addons.map((addon) =>
              addon.id === addonId ? { ...addon, isAdded } : addon,
            ),
          }
        : entry,
    ),
    cart.appliedVouchers,
  );
}

function createOrderConfirmation(
  request: PlaceOrderRequest,
  fallbackCart: Cart,
  sequence: number,
): OrderConfirmation {
  const cart = request.cart ?? fallbackCart;
  const orderNumber = `OR-20260618-${String(sequence).padStart(4, '0')}`;
  const payment = asRecord(request.checkoutData['payment']);
  const shipping = asRecord(request.checkoutData['shipping']);
  const paymentMethod = readString(payment, 'paymentMethod', 'card');
  const shippingMethod = readString(shipping, 'shippingMethod', 'standard');
  const fulfillmentOption = fulfillmentOptions.find(
    (option) => option.code === shippingMethod,
  );
  const paymentStatus: PaymentStatus =
    paymentMethod === 'cod' ? 'pending' : 'paid';

  return {
    id: orderNumber,
    orderNumber,
    customerEmail: readString(asRecord(request.checkoutData['customer']), 'email'),
    paymentStatus,
    orderStatus: paymentStatus === 'paid' ? 'confirmed' : 'pending_payment',
    items: cart.entries.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      totalPrice: item.totalPrice,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      itemSpecs: item.itemSpecs,
      addons: item.addons.filter((addon) => addon.isAdded),
    })),
    shippingAddress: getShippingAddress(request.checkoutData),
    deliveryEstimate:
      fulfillmentOption?.estimatedAvailability ?? '3-5 business days',
    deliveredAt: '2026-06-21T00:00:00.000Z',
    trackingNumber: 'ABC123456',
    courier: fulfillmentOption?.courierName ?? 'Orange Express',
    invoiceUrl: `/api/orders/${orderNumber}/invoice`,
    subtotalAmount: getCartTotal(cart),
    shippingAmount: 0,
    discountAmount: 0,
    totalAmount: getCartTotal(cart),
    nextSteps: getNextSteps(request.checkoutData, paymentStatus),
    placedAt: '2026-06-18T00:00:00.000Z',
  };
}

function getShippingAddress(
  checkoutData: PlaceOrderRequest['checkoutData'],
): OrderConfirmation['shippingAddress'] {
  const customer = asRecord(checkoutData['customer']);
  const deliveryAddress = asRecord(customer['deliveryAddress']);
  const firstName = readString(customer, 'firstName');
  const lastName = readString(customer, 'lastName');
  const recipientName = [firstName, lastName].filter(Boolean).join(' ');

  return {
    recipientName,
    mobileNumber: readString(customer, 'mobileNumber'),
    addressLine1:
      readString(deliveryAddress, 'addressLine1') ||
      readString(deliveryAddress, 'street'),
    addressLine2: readString(deliveryAddress, 'addressLine2') || undefined,
    barangay: readString(deliveryAddress, 'barangay') || undefined,
    city: readString(deliveryAddress, 'city'),
    region: readString(deliveryAddress, 'region') || undefined,
    postalCode: readString(deliveryAddress, 'postalCode'),
    country: 'Philippines',
  };
}

function getCartTotal(cart: Cart): number {
  return (
    cart.cartSummary.find((item) => item.name.toLowerCase() === 'total')
      ?.amount ??
    cart.entries.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    )
  );
}

function getNextSteps(
  checkoutData: PlaceOrderRequest['checkoutData'],
  paymentStatus: PaymentStatus,
): string[] {
  const customer = asRecord(checkoutData['customer']);
  const email = readString(customer, 'email');

  return [
    paymentStatus === 'paid'
      ? 'Your payment has been processed successfully.'
      : 'Payment will be collected when your order is delivered.',
    email
      ? `We sent the order details to ${email}.`
      : 'We sent the order details to your email.',
    'We will notify you when the order starts processing.',
  ];
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  record: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const value = record[key];

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

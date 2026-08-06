# Project Orange UI

Project Orange UI is an Angular storefront and admin workspace for a multi-country commerce experience. It includes site-aware routing, product listing and detail pages, wishlist saves, cart and checkout flows with localized payment methods, guest order lookup, order confirmation and history, add-on experiences, authentication, profile pages, and a standalone admin app for analytics, orders, products, inventory, promotions, and customers. The project is covered by unit and Playwright end-to-end tests, with CI running library builds, lint, unit tests, e2e tests, and production builds.

## Demos

> ⚠️ Demo GIF may take a few seconds to load depending on your network connection.

Storefront guest checkout flow

![Storefront guest checkout flow](demos/storefront-2.gif)

Admin app

![Admin app](demos/admin.gif)

## Tech Stack

- Angular 20 with standalone components and lazy routes
- Angular SSR/server output with client hydration
- Angular Material, Angular CDK, SCSS, and Bootstrap Icons
- npm workspaces with buildable `@orange/*` Angular libraries
- NgRx Store, Effects, and Store DevTools for products, cart, and trade-in state
- ngx-translate with split translation resources
- Vitest through Angular's unit test builder
- Playwright for end-to-end tests

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The app runs at `http://localhost:4200/`. The dev server uses `proxy.conf.cjs` to forward `/api` requests to `http://localhost:5175`. Analytics requests prefer the json-server mock on `http://localhost:5176` when it is running, and fall back to `http://localhost:5175` otherwise.

For the local analytics dashboard mock, ensure a root `db.json` file exists. An empty `{}` object is enough to use the generated defaults. Then run this in a second terminal:

```bash
npm run mock:api
```

To enter the storefront, choose a country from the root page or visit a site-scoped route directly:

```text
http://localhost:4200/ph/products
http://localhost:4200/fr/products
http://localhost:4200/cn/products
http://localhost:4200/jp/products
```

Run the standalone admin app when working on administration features:

```bash
npm run ng -- serve project-orange-admin
```

It uses `http://localhost:4200` when run by itself. To run it alongside the storefront, choose another port:

```bash
npm run ng -- serve project-orange-admin --port 4201
```

The admin app runs from `projects/admin/src/app`. Its root redirects to `/admin/analytics`; `/admin/login` is public, while the other `/admin/*` routes require an authenticated admin session.

Admin login/session requests still use the primary backend at `http://localhost:5175`. The analytics mock on port `5176` supplies dashboard data only.

## Available Scripts

| Command                                       | Description                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm start`                                   | Runs `ng serve project-orange-storefront` with `proxy.conf.cjs`.                     |
| `npm run mock:api`                            | Runs the local json-server analytics mock on port `5176`.                            |
| `npm run start:e2e`                           | Runs the storefront dev server with the static e2e build configuration.              |
| `npm run build`                               | Builds the default storefront app for production into `dist/`.                       |
| `npm run build:libs`                          | Builds all shared `@orange/*` libraries.                                              |
| `npm run build:all`                           | Builds the shared libraries, storefront, and admin app.                               |
| `npm run ng -- build project-orange-admin`    | Builds the standalone admin app into `dist/project-orange-admin`.                    |
| `npm run watch`                               | Builds in watch mode with the development configuration.                             |
| `npm test`                                    | Runs storefront and shared-library unit tests.                                       |
| `npm run test:watch`                          | Runs storefront and shared-library unit tests in watch mode.                         |
| `npm run test:ci`                             | Runs storefront and shared-library unit tests once.                                  |
| `npm run e2e`                                 | Runs Playwright tests.                                                               |
| `npm run e2e:ui`                              | Opens the Playwright UI runner.                                                      |
| `npm run e2e:headed`                          | Runs Playwright tests in headed mode.                                                |
| `npm run lint`                                | Runs Angular ESLint for the storefront and shared source.                            |
| `npm run lint:libs`                           | Runs Angular ESLint for all shared libraries.                                         |
| `npm run build:ssr`                           | Builds the server-output application.                                                |
| `npm run serve:ssr:project-orange-storefront` | Serves the built SSR bundle from `dist/project-orange-storefront/server/server.mjs`. |

## Application Flow

The root route (`/`) loads the country entry screen. It uses `/api/sites` and `/api/geo/country` to list supported sites and suggest a country when possible. The selected site is saved in local storage under `orange.sitePreference`.

For detailed analytics dashboard documentation, see [Dashboard Analytics](projects/admin/src/app/pages/analytics/README.md). The dashboard now lives in the standalone admin app under `projects/admin/src/app/pages/analytics`.

Most app routes are scoped by site:

| Route                                  | Purpose                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/:site`                               | Storefront home page.                                                                            |
| `/:site/products`                      | Product listing with category, sort, price filters, and save toggles.                            |
| `/:site/products/:productId`           | Product detail page.                                                                             |
| `/:site/products/:productId/configure` | Product configurator and add-to-cart flow.                                                       |
| `/:site/cart`                          | Cart review, quantity updates, vouchers, shipping, and add-ons.                                  |
| `/:site/checkout`                      | Dynamic checkout form, shipping, site-aware payments, draft persistence, and order summary flow. |
| `/:site/auth/login`                    | Sign in.                                                                                         |
| `/:site/auth/register`                 | Account registration.                                                                            |
| `/:site/auth/forgot-password`          | Password reset entry point.                                                                      |
| `/:site/auth/reset-password`           | Complete password reset with email and token.                                                    |
| `/:site/orders`                        | Guest order lookup or signed-in order history.                                                   |
| `/:site/orders/my-orders`              | Orders route alias for lookup and history.                                                       |
| `/:site/orders/confirmation/:orderId`  | Order confirmation page after checkout.                                                          |
| `/:site/support`                       | Customer support page.                                                                           |
| `/:site/profile/account-settings`      | Customer account settings.                                                                       |
| `/:site/profile/wishlist`              | Authenticated customer wishlist with saved products.                                             |

Unsupported site codes are redirected back to the country selector.

The standalone admin app owns pages outside the site-scoped storefront route tree:

| Route               | Access              | Purpose                         |
| ------------------- | ------------------- | ------------------------------- |
| `/admin/login`      | Public              | Admin sign-in.                  |
| `/admin/analytics`  | Authenticated admin | Analytics dashboard.            |
| `/admin/orders`     | Authenticated admin | Order management.               |
| `/admin/products`   | Authenticated admin | Product management.             |
| `/admin/inventory`  | Authenticated admin | Inventory management.           |
| `/admin/promotions` | Authenticated admin | Promotion management.           |
| `/admin/customers`  | Authenticated admin | Customer management.            |

## API Behavior

All API calls start with `/api`. During local development, `proxy.conf.cjs` forwards most requests to `http://localhost:5175`; analytics dashboard and analytics event routes prefer the json-server mock at `http://localhost:5176` and fall back to `http://localhost:5175` when the mock is not running.

`ApiSitePrefixInterceptor` automatically prefixes scoped API calls with the active site code. For example, a component that requests:

```text
/api/products
```

while the active route is `/ph/products` is sent as:

```text
/api/ph/products
```

The interceptor leaves these unscoped endpoints unchanged:

```text
/api/sites
/api/sites/:site
/api/geo/country
/api/payments/intents
/api/payments/confirm
```

Primary API areas used by the UI:

| Area              | Endpoints                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sites             | `GET /api/sites`, `GET /api/sites/:site`                                                                                                                                                                                                             |
| Country detection | `GET /api/geo/country`                                                                                                                                                                                                                               |
| Auth              | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/session`, `POST /api/auth/logout`                                                                               |
| Catalog           | `GET /api/products`, `GET /api/products/:id`, `GET /api/products/search/suggestions`, `GET /api/categories`                                                                                                                                          |
| Product add-ons   | `GET /api/products/:id/insurance-plans`, `GET /api/products/:id/mobile-plans`                                                                                                                                                                        |
| Wishlist          | `GET /api/wishlist`, `POST /api/wishlist/items`, `GET /api/wishlist/items/:productId`, `DELETE /api/wishlist/items/:productId`                                                                                                                       |
| Cart              | `GET /api/carts/:cartCode`, `GET /api/carts/:cartCode/recommended-products`, `POST /api/carts/items`, `POST /api/carts/:cartCode/items`, `PUT /api/carts/:cartCode/items/:variantId`, `DELETE /api/carts/:cartCode/items/:variantId`                 |
| Cart add-ons      | `PUT /api/carts/:cartCode/items/:variantId/addons/:addonId`, `DELETE /api/carts/:cartCode/items/:variantId/addons/:addonId`                                                                                                                          |
| Vouchers          | `POST /api/carts/:cartCode/vouchers`, `DELETE /api/carts/:cartCode/vouchers/:code`                                                                                                                                                                   |
| Checkout          | `GET /api/checkout/form`, `GET /api/options/:kind`                                                                                                                                                                                                   |
| Payments          | `POST /api/payments/intents`, `POST /api/payments/confirm`                                                                                                                                                                                           |
| Orders            | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:orderNumber`, `GET /api/orders/lookup?orderNumber=...&email=...`                                                                                                                            |
| Fulfillment       | `GET /api/fulfillment/options?postalCode=...`, `GET /api/postal-codes/validate?postalCode=...`, `PUT /api/carts/:cartCode/shipping`                                                                                                                   |
| Trade-in          | `GET /api/trade-ins/config`, `GET /api/trade-ins/categories`, `GET /api/trade-ins/brands`, `GET /api/trade-ins/devices`, `GET /api/trade-ins/storages`                                                                                               |
| Trade-in sessions | `POST /api/trade-in-sessions`, `GET /api/trade-in-sessions/:id`, `PATCH /api/trade-in-sessions/:id/step-one`, `PATCH /api/trade-in-sessions/:id/step-two`, `PATCH /api/trade-in-sessions/:id/step-three`, `PATCH /api/trade-in-sessions/:id/confirm` |

Auth requests use credentials and XSRF support. `AuthInterceptor` adds `withCredentials` to API requests and redirects unauthenticated users to the site login page when protected requests return `401`.

Wishlist routes require an authenticated session and are scoped to the active site by the site-prefix interceptor. Product cards expose a bookmark save toggle; unauthenticated users see the shared confirmation dialog before being sent to login with the current URL preserved as `returnUrl`.

## Checkout and Payments

Checkout uses `/api/checkout/form` for dynamic steps, saves drafts under `checkoutData`, and supports schema-provided payment methods through unscoped `/api/payments/intents` and `/api/payments/confirm` endpoints.

## Mock Auth

Mock auth is available through `MockAuthInterceptor`, but it is disabled by default. To enable it for local work, set `useMockAuth` to `true` in the active environment file:

```ts
export const environment = {
  production: false,
  useMockAuth: true,
  useMockPayments: true,
};
```

The mock interceptor handles:

- `GET /api/geo/country`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/session`
- `POST /api/auth/logout`

The default mock user is an admin user with broad product, inventory, order, and user permissions.

## Mock Payments

`MockPaymentInterceptor` is enabled locally and in staging; card and GCash values ending in `0000` fail, `9999` stays pending, and offline methods return pending instructions.

## State Management

Global feature state is registered in `projects/storefront/src/app/app.config.ts`:

- `productFeature` and `ProductEffects` for catalog loading and filters
- `cartFeature` and `CartEffects` for cart, vouchers, shipping, and add-ons
- `tradeInFeature` and `TradeInEffects` for trade-in configuration and sessions

Feature facades sit beside their stores and are the preferred integration point for components. Wishlist state is kept in `WishlistService` because it is a small authenticated user collection shared by product cards and the profile wishlist page.

## Localization and Sites

Translations live in `projects/storefront/src/assets/i18n/<language>/`. The current resources are:

```text
common.json
home.json
products.json
cart.json
wishlist.json
orders.json
checkout.json
auth.json
support.json
```

`MultiTranslateLoader` loads and merges those resources for the active language. Current language folders are:

```text
en
fr
zh
ja
```

Site configuration is loaded from the backend through `SiteService`. Each site includes:

- `code`
- `countryName`
- `locale`
- `currency`
- `defaultLanguage`
- `supportedLanguages`
- `features`

Feature flags currently affect add-ons such as insurance, trade-in, and vouchers.

## Project Structure

```text
libs/core
  auth/             Authentication API client and session store
  guards/           Auth, role, and site route guards
  i18n/             Site types and multi-file translation loader
  interceptors/     API site prefixing, auth, and mock auth
  models/           Shared API/domain contracts, auth contracts, roles, and permissions
  services/         Analytics, site, storage, country detection, and postal code services

libs/shared
  constants/        Shared regex and validation constants
  directives/       Shared input-formatting directives
  pipes/            Shared pipes
  validators/       Shared validators

libs/ui
  Shared controls such as buttons, dropdowns, sliders, spinners, and dialogs

libs/styles
  Shared SCSS tokens, utilities, global styles, and font assets

projects/storefront/src/app/features
  auth/             Login, register, forgot password, reset password
  cart/             Cart page, cart store, cart API, cart item add-ons
  checkout/         Dynamic checkout form, shipping, payment methods, draft storage
  common/           Reusable commerce UI such as order summary, order items, voucher, CTA
  country-entry/    Country selector and detected-country entry flow
  home/             Home feature
  orders/           Guest lookup, signed-in history, confirmation, and expandable order items
  products/         Product list, product detail/configurator, filters, product store
  profile/          Account settings and wishlist
  trade-in/         Trade-in store and API

projects/storefront/src/app/layout
  auth-layout/      Layout for auth pages
  checkout-layout/  Layout for cart and checkout
  main-layout/      Storefront shell
  header/ footer/ sidebar/

projects/admin/src/app
  app.routes.ts     Standalone admin app routes
  pages/            Login, analytics, orders, products, inventory, promotions, customers
```

## Workspace Libraries

Application and library consumers import shared code through folder-specific public entry points:

| Entry-point pattern       | Available folders                                                        |
| ------------------------- | ------------------------------------------------------------------------ |
| `@orange/core/<folder>`   | `auth`, `guards`, `i18n`, `interceptors`, `models`, `services`            |
| `@orange/shared/<folder>` | `constants`, `directives`, `pipes`, `validators`                          |
| `@orange/ui/<folder>`     | One folder per reusable UI component, such as `button` or `select-dropdown` |

For example, import `AnalyticsDashboard` from `@orange/core/models`, `SiteService` from `@orange/core/services`, and `IconPipe` from `@orange/shared/pipes`.

Do not import implementation files through `libs/...`. Build and lint the package boundaries with `npm run build:libs` and `npm run lint:libs`.

## Testing

Run storefront and shared-library unit tests:

```bash
npm run test:ci
```

Run admin unit tests:

```bash
npm run ng -- test project-orange-admin --watch=false
```

Run Playwright e2e tests:

```bash
npm run e2e
```

The Playwright configuration starts both apps automatically:

```text
Storefront: http://localhost:4300
Admin:      http://localhost:4301/admin/analytics
```

The e2e suite mocks the Orange API in `e2e/app.spec.ts` and uses fixture data from `e2e/fixtures/catalog.ts`, so a backend is not required for e2e tests.

If Playwright browsers are missing, install Chromium:

```bash
npx playwright install chromium
```

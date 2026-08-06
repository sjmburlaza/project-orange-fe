import { Routes } from '@angular/router';
import { AuthGuard } from '@orange/core/guards';
// import { HomeComponent } from 'src/app/features/home/home.component';
import { MainLayoutComponent } from 'src/app/layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from 'src/app/layout/auth-layout/auth-layout.component';
import { CheckoutLayoutComponent } from 'src/app/layout/checkout-layout/checkout-layout.component';
import { siteGuard } from '@orange/core/guards';
import { CountryEntryComponent } from 'src/app/features/country-entry/country-entry.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: CountryEntryComponent },
  {
    path: ':site',
    canActivate: [siteGuard],
    children: [
      {
        path: '',
        component: MainLayoutComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadChildren: () =>
              import('./features/home/home.routes').then(
                (m) => m.HOME_ROUTES,
              ),
          },
          {
            path: 'products',
            loadChildren: () =>
              import('./features/products/products.routes').then(
                (m) => m.PRODUCTS_ROUTES,
              ),
          },
          {
            path: 'orders',
            loadChildren: () =>
              import('./features/orders/orders.routes').then(
                (m) => m.ORDERS_ROUTES,
              ),
          },
          {
            path: 'support',
            loadComponent: () =>
              import('./features/support/support.component').then(
                (m) => m.SupportComponent,
              ),
          },
          {
            path: 'profile',
            canActivate: [AuthGuard],
            loadChildren: () =>
              import('./features/profile/profile.routes').then(
                (m) => m.PROFILE_ROUTES,
              ),
          },
        ],
      },
      {
        path: '',
        component: CheckoutLayoutComponent,
        children: [
          {
            path: 'cart',
            loadChildren: () =>
              import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
          },
          {
            path: 'checkout',
            loadChildren: () =>
              import('./features/checkout/checkout.routes').then(
                (m) => m.CHECKOUT_ROUTES,
              ),
          },
        ],
      },
      {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

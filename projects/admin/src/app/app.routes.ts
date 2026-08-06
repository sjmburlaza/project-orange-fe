import { Routes } from '@angular/router';
import { ROLES } from '@orange/core/models';
import { AuthGuard } from '@orange/core/guards';
import { RoleGuard } from '@orange/core/guards';

export const routes: Routes = [
  { path: '', redirectTo: 'admin/analytics', pathMatch: 'full' },
  {
    path: 'admin',
    children: [
      {
        path: '',
        redirectTo: 'analytics',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: '',
        canActivate: [AuthGuard, RoleGuard],
        data: { role: ROLES.ADMIN },
        children: [
          {
            path: 'analytics',
            loadComponent: () =>
              import('./pages/analytics/analytics.component').then(
                (m) => m.AnalyticsComponent,
              ),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./pages/orders/orders.component').then(
                (m) => m.OrdersComponent,
              ),
          },
          {
            path: 'products',
            loadComponent: () =>
              import('./pages/products/products.component').then(
                (m) => m.ProductsComponent,
              ),
          },
          {
            path: 'inventory',
            loadComponent: () =>
              import('./pages/inventory/inventory.component').then(
                (m) => m.InventoryComponent,
              ),
          },
          {
            path: 'promotions',
            loadComponent: () =>
              import('./pages/promotions/promotions.component').then(
                (m) => m.PromotionsComponent,
              ),
          },
          {
            path: 'customers',
            loadComponent: () =>
              import('./pages/customers/customers.component').then(
                (m) => m.CustomersComponent,
              ),
          },
        ],
      },
    ],
  },
];

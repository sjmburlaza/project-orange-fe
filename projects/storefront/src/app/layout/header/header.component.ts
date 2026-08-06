import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, map } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import { SearchComponent } from 'src/app/features/common/search/search.component';

interface PrimaryNavigationItem {
  translationKey: string;
  path: string | null;
}

@Component({
  selector: 'app-header',
  imports: [
    MatBadgeModule,
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    TranslatePipe,
    SearchComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly cartFacade = inject(CartFacade);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  readonly siteService = inject(SiteService);
  readonly itemCount$ = this.cartFacade.itemCount$;
  readonly site = this.siteService.currentSite;

  readonly primaryNavigationItems: readonly PrimaryNavigationItem[] = [
    { translationKey: 'common.navigation.home', path: null },
    { translationKey: 'common.navigation.shop', path: 'products' },
  ];

  readonly accountMenuItems$ = this.authStore.isAuthenticated$.pipe(
    map((isAuthenticated) => [
      {
        label: 'Orders',
        icon: 'bi-box-seam',
        action: () => this.goToOrders(),
      },
      {
        label: 'Wishlist',
        icon: 'bi-heart',
        action: () => this.goToSaves(),
      },
      {
        label: 'Account',
        icon: 'bi-person',
        action: () => this.goToAccount(),
      },
      {
        label: isAuthenticated ? 'Sign Out' : 'Sign In',
        icon: isAuthenticated ? 'bi-box-arrow-right' : 'bi-box-arrow-in-right',
        action: () => (isAuthenticated ? this.logout() : this.goToLogin()),
      },
    ]),
  );

  ngOnInit(): void {
    this.cartFacade.loadCart();
  }

  get isCheckoutRoute(): boolean {
    return this.router.url.includes('/checkout');
  }

  goToCart(): void {
    this.router.navigate([`/${this.site()}/cart`]);
  }

  goToOrders(): void {
    this.router.navigate([`/${this.site()}/orders/my-orders`]);
  }

  goToSaves(): void {
    this.router.navigate([`/${this.site()}/profile/wishlist`]);
  }

  goToAccount(): void {
    this.router.navigate([`/${this.site()}/profile/account-settings`]);
  }

  goToLogin(): void {
    this.router.navigate([`/${this.site()}/auth/login`]);
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.authStore.clearSession();
          this.goToLogin();
        }),
      )
      .subscribe({
        error: (error) => {
          console.error('Logout failed:', error);
        },
      });
  }
}

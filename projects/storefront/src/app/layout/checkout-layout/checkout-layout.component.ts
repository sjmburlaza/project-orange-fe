import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SiteService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import { AcceptedPaymentsComponent } from 'src/app/features/common/accepted-payments/accepted-payments.component';
import { RecommendedProductsComponent } from 'src/app/features/common/recommended-products/recommended-products.component';
import { FooterComponent } from 'src/app/layout/footer/footer.component';
import { HeaderComponent } from 'src/app/layout/header/header.component';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { IconPipe } from '@orange/shared/pipes';

@Component({
  selector: 'app-checkout-layout',
  imports: [
    HeaderComponent,
    RouterOutlet,
    FooterComponent,
    SidebarComponent,
    AsyncPipe,
    TranslatePipe,
    IconPipe,
    MatAnchor,
    RouterLink,
    AcceptedPaymentsComponent,
    RecommendedProductsComponent,
  ],
  templateUrl: './checkout-layout.component.html',
  styleUrl: './checkout-layout.component.scss',
})
export class CheckoutLayoutComponent {
  private readonly cartFacade = inject(CartFacade);
  private readonly router = inject(Router);
  readonly siteService = inject(SiteService);
  readonly site = this.siteService.currentSite;
  readonly itemCount$ = this.cartFacade.itemCount$;

  get isCartPage(): boolean {
    return this.router.url.includes('/cart');
  }
}

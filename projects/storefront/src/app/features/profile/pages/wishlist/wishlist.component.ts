import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StockStatus } from '@orange/core/models';
import { WishlistProductSummary } from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { WishlistService } from 'src/app/features/profile/services/wishlist.service';
import { IconPipe } from '@orange/shared/pipes';

@Component({
  selector: 'app-wishlist',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, IconPipe, TranslatePipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit {
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  readonly siteService = inject(SiteService);

  readonly wishlist$ = this.wishlistService.wishlist$;
  readonly loading$ = this.wishlistService.loading$;
  readonly error$ = this.wishlistService.error$;
  readonly mutatingProductIds$ = this.wishlistService.mutatingProductIds$;

  ngOnInit(): void {
    this.wishlistService.loadWishlist();
  }

  reload(): void {
    this.wishlistService.loadWishlist();
  }

  removeProduct(productId: number): void {
    this.wishlistService.removeProduct(productId);
  }

  configureProduct(productId: number): void {
    this.router.navigate([
      '/',
      this.siteService.currentSite(),
      'products',
      productId,
      'configure',
    ]);
  }

  viewProduct(productId: number): void {
    this.router.navigate([
      '/',
      this.siteService.currentSite(),
      'products',
      productId,
    ]);
  }

  continueShopping(): void {
    this.router.navigate(['/', this.siteService.currentSite(), 'products']);
  }

  getStockStatus(product: WishlistProductSummary): StockStatus {
    return (
      product.stockStatus ??
      (product.stockQuantity > 0 ? 'inStock' : 'outOfStock')
    );
  }
}

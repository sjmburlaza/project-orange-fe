import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { distinctUntilChanged, filter, map } from 'rxjs';
import {
  ProductConfigure,
  ProductOption,
  ProductVariant,
  StockStatus,
} from '@orange/core/models';
import { AnalyticsService } from '@orange/core/services';
import { SiteService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import { ProductFacade } from 'src/app/features/products/store/products.facade';
import { ConfirmDialogComponent } from '@orange/ui/confirm-dialog';
import { QuantitySelectorComponent } from '@orange/ui/quantity-selector';
import { IconPipe } from '@orange/shared/pipes';
import { VariantColorPipe } from '@orange/shared/pipes';

@Component({
  selector: 'app-product-configurator',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    IconPipe,
    MatButtonModule,
    QuantitySelectorComponent,
    RouterLink,
    VariantColorPipe,
    TranslatePipe,
  ],
  templateUrl: './product-configurator.component.html',
  styleUrl: './product-configurator.component.scss',
})
export class ProductConfiguratorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly analytics = inject(AnalyticsService);
  private readonly productFacade = inject(ProductFacade);
  private readonly cartFacade = inject(CartFacade);
  readonly siteService = inject(SiteService);
  readonly currentSite = this.siteService.currentSite;

  readonly product$ = this.productFacade.selectedProductConfigure$;
  readonly loading$ = this.productFacade.loadingProductConfigure$;
  readonly error$ = this.productFacade.productConfigureError$;

  selectedOptions: Record<string, string> = {};
  selectedVariant: ProductVariant | null = null;
  quantity = 1;

  private initializedProductId: number | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('productId'))),
        filter((id) => Number.isFinite(id) && id > 0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        this.initializedProductId = null;
        this.productFacade.loadProductConfigure(id);
      });

    this.product$
      .pipe(
        filter((product): product is ProductConfigure => product !== null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((product) => {
        if (this.initializedProductId !== product.id) {
          this.initializeSelection(product);
        }
      });

    this.cartFacade.addToCartSuccess$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '520px',
          maxWidth: '90vw',
          data: {
            title: 'products.cart.addedTitle',
            message: 'products.cart.addedMessage',
            cancel: 'products.cart.continueShopping',
            proceed: 'products.cart.goToCart',
          },
        });

        dialogRef.afterClosed().subscribe((res) => {
          if (res === 'proceed') {
            this.router.navigate(['/', this.currentSite(), 'cart']);
          }
          if (res === 'cancel') {
            this.router.navigate(['/', this.currentSite(), 'products']);
          }
        });
      });
  }

  selectOption(
    product: ProductConfigure,
    groupCode: string,
    option: ProductOption,
  ): void {
    if (!this.isOptionAvailable(product, groupCode, option.code)) {
      return;
    }

    this.selectedOptions = {
      ...this.selectedOptions,
      [groupCode]: option.code,
    };
    this.updateSelectedVariant(product);
  }

  isOptionSelected(groupCode: string, optionCode: string): boolean {
    return this.selectedOptions[groupCode] === optionCode;
  }

  isOptionAvailable(
    product: ProductConfigure,
    groupCode: string,
    optionCode: string,
  ): boolean {
    const constraints = {
      ...this.selectedOptions,
      [groupCode]: optionCode,
    };

    return product.variants.some(
      (variant) =>
        variant.stockQuantity > 0 && this.variantMatches(variant, constraints),
    );
  }

  getStockQuantity(product: ProductConfigure): number {
    return this.selectedVariant?.stockQuantity ?? product.stockQuantity;
  }

  getStockStatus(product: ProductConfigure): StockStatus {
    return (
      this.selectedVariant?.stockStatus ??
      product.stockStatus ??
      (this.getStockQuantity(product) > 0 ? 'inStock' : 'outOfStock')
    );
  }

  getQuantityMax(product: ProductConfigure): number {
    return Math.max(this.getStockQuantity(product), 1);
  }

  onQuantityChange(value: number): void {
    this.quantity = value;
  }

  addToCart(product: ProductConfigure): void {
    if (!this.selectedVariant || this.selectedVariant.stockQuantity <= 0) {
      return;
    }

    this.analytics.trackAddToCart(product, this.quantity);
    this.cartFacade.addToCart({
      variantId: this.selectedVariant.id,
      quantity: this.quantity,
      addons: [],
    });
  }

  canAddToCart(product: ProductConfigure): boolean {
    return (
      this.selectedVariant !== null &&
      this.selectedVariant.stockQuantity > 0 &&
      this.quantity > 0 &&
      this.quantity <= this.getQuantityMax(product)
    );
  }

  private initializeSelection(product: ProductConfigure): void {
    const firstAvailableVariant =
      product.variants.find((variant) => variant.stockQuantity > 0) ??
      product.variants[0] ??
      null;

    this.selectedOptions = firstAvailableVariant
      ? { ...firstAvailableVariant.options }
      : this.getDefaultOptions(product);
    this.selectedVariant = firstAvailableVariant;
    this.quantity = 1;
    this.initializedProductId = product.id;
    this.updateSelectedVariant(product);
  }

  private getDefaultOptions(product: ProductConfigure): Record<string, string> {
    return product.optionGroups.reduce<Record<string, string>>(
      (options, group) => {
        const firstOption = group.options[0];

        return firstOption
          ? {
              ...options,
              [group.code]: firstOption.code,
            }
          : options;
      },
      {},
    );
  }

  private updateSelectedVariant(product: ProductConfigure): void {
    const matchingVariant =
      product.variants.find(
        (variant) =>
          variant.stockQuantity > 0 &&
          this.variantMatches(variant, this.selectedOptions),
      ) ??
      product.variants.find((variant) =>
        this.variantMatches(variant, this.selectedOptions),
      ) ??
      null;

    this.selectedVariant = matchingVariant;
    this.quantity = Math.min(this.quantity, this.getQuantityMax(product));
  }

  private variantMatches(
    variant: ProductVariant,
    selectedOptions: Record<string, string>,
  ): boolean {
    return Object.entries(selectedOptions).every(
      ([groupCode, optionCode]) =>
        variant.options[groupCode]?.toLowerCase() === optionCode.toLowerCase(),
    );
  }
}

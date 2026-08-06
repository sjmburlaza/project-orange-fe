import { AsyncPipe, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, distinctUntilChanged, filter, map } from 'rxjs';
import { Cart } from '@orange/core/models';
import {
  ProductConfigure,
  ProductOption,
  ProductOptionGroup,
  ProductVariant,
} from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { CartFacade } from 'src/app/features/cart/store/cart.facade';
import {
  CarouselComponent,
  CarouselItemDirective,
} from '@orange/ui/carousel';
import { IconPipe } from '@orange/shared/pipes';
import { VariantColorPipe } from '@orange/shared/pipes';

interface RecommendedProductState {
  selectedOptions: Record<string, string>;
}

interface RecommendedProductOption extends ProductOption {
  available: boolean;
  selected: boolean;
}

interface RecommendedProductOptionGroup
  extends Omit<ProductOptionGroup, 'options'> {
  options: RecommendedProductOption[];
}

interface RecommendedProductCard {
  product: ProductConfigure;
  selectedOptions: Record<string, string>;
  optionGroups: RecommendedProductOptionGroup[];
  imageUrl: string;
  price: number;
  canAdd: boolean;
}

@Component({
  selector: 'app-recommended-products',
  imports: [
    AsyncPipe,
    CarouselComponent,
    CarouselItemDirective,
    CurrencyPipe,
    IconPipe,
    MatButtonModule,
    VariantColorPipe,
    TranslatePipe,
  ],
  templateUrl: './recommended-products.component.html',
  styleUrl: './recommended-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendedProductsComponent implements OnInit {
  private readonly cartFacade = inject(CartFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly recommendedProductCardsSubject = new BehaviorSubject<
    RecommendedProductCard[]
  >([]);
  private productStates: Record<number, RecommendedProductState> = {};
  private products: ProductConfigure[] = [];
  readonly visibleProductCount = 3;
  readonly siteService = inject(SiteService);
  readonly recommendedProductCards$ =
    this.recommendedProductCardsSubject.asObservable();

  ngOnInit(): void {
    this.watchRecommendedProducts();
    this.watchRecommendedProductsRefresh();
  }

  selectOption(
    product: ProductConfigure,
    groupCode: string,
    option: ProductOption,
  ): void {
    const state = this.getProductState(product);

    if (
      !this.isProductOptionAvailable(
        product,
        state.selectedOptions,
        groupCode,
        option.code,
      )
    ) {
      return;
    }

    this.setProductState(product.id, {
      selectedOptions: {
        ...state.selectedOptions,
        [groupCode]: option.code,
      },
    });
    this.updateRecommendedProductCards();
  }

  addProduct(product: ProductConfigure): void {
    const variant = this.getSelectedVariant(product);

    if (!variant || variant.stockQuantity <= 0) {
      return;
    }

    this.cartFacade.addToCart({
      variantId: variant.id,
      quantity: 1,
      addons: [],
    });
  }

  private setProducts(value: ProductConfigure[] | null): void {
    this.products = value ?? [];
    this.initializeProductStates();
    this.updateRecommendedProductCards();
  }

  private watchRecommendedProducts(): void {
    this.cartFacade.recommendedProducts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.setProducts(products);
      });
  }

  private watchRecommendedProductsRefresh(): void {
    this.cartFacade.cart$
      .pipe(
        map((cart) => this.getRecommendedProductsRefreshKey(cart)),
        filter((key): key is string => key !== null),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.cartFacade.loadRecommendedProducts();
      });
  }

  private getRecommendedProductsRefreshKey(cart: Cart | null): string | null {
    if (!cart || cart.entries.length === 0) {
      return null;
    }

    const itemKey = cart.entries
      .map((item) => `${item.variantId}:${item.quantity}`)
      .join('|');

    return `${cart.code}:${itemKey}`;
  }

  private initializeProductStates(): void {
    const nextStates = this.products.reduce<
      Record<number, RecommendedProductState>
    >((states, product) => {
      states[product.id] =
        this.productStates[product.id] ?? this.createInitialState(product);

      return states;
    }, {});

    this.productStates = nextStates;
  }

  private updateRecommendedProductCards(): void {
    this.recommendedProductCardsSubject.next(
      this.products.map((product) => this.createProductCard(product)),
    );
  }

  private createProductCard(product: ProductConfigure): RecommendedProductCard {
    const selectedOptions = this.getProductState(product).selectedOptions;
    const selectedVariant = this.getSelectedVariant(product, selectedOptions);

    return {
      product,
      selectedOptions,
      optionGroups: this.getOptionGroupViews(product, selectedOptions),
      imageUrl: selectedVariant?.imageUrl || product.imageUrl,
      price: selectedVariant?.price ?? product.price,
      canAdd: selectedVariant !== null && selectedVariant.stockQuantity > 0,
    };
  }

  private getProductOptionGroups(product: ProductConfigure): ProductOptionGroup[] {
    return product.optionGroups ?? [];
  }

  private getOptionGroupViews(
    product: ProductConfigure,
    selectedOptions: Record<string, string>,
  ): RecommendedProductOptionGroup[] {
    return this.getProductOptionGroups(product).map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        available: this.isProductOptionAvailable(
          product,
          selectedOptions,
          group.code,
          option.code,
        ),
        selected: selectedOptions[group.code] === option.code,
      })),
    }));
  }

  private createInitialState(
    product: ProductConfigure,
  ): RecommendedProductState {
    const firstAvailableVariant =
      this.getProductVariants(product).find((variant) => variant.stockQuantity > 0) ??
      this.getProductVariants(product)[0] ??
      null;

    return {
      selectedOptions: firstAvailableVariant
        ? { ...firstAvailableVariant.options }
        : this.getDefaultOptions(product),
    };
  }

  private getDefaultOptions(product: ProductConfigure): Record<string, string> {
    return this.getProductOptionGroups(product).reduce<Record<string, string>>(
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

  private getProductState(product: ProductConfigure): RecommendedProductState {
    const state = this.productStates[product.id];

    if (state) {
      return state;
    }

    const nextState = this.createInitialState(product);
    this.setProductState(product.id, nextState);

    return nextState;
  }

  private setProductState(
    productId: number,
    state: RecommendedProductState,
  ): void {
    this.productStates = {
      ...this.productStates,
      [productId]: state,
    };
  }

  private getProductVariants(product: ProductConfigure): ProductVariant[] {
    return product.variants ?? [];
  }

  private getSelectedVariant(
    product: ProductConfigure,
    selectedOptions = this.getProductState(product).selectedOptions,
  ): ProductVariant | null {
    return (
      this.getProductVariants(product).find(
        (variant) =>
          variant.stockQuantity > 0 &&
          this.variantMatches(variant, selectedOptions),
      ) ??
      this.getProductVariants(product).find((variant) =>
        this.variantMatches(variant, selectedOptions),
      ) ??
      null
    );
  }

  private isProductOptionAvailable(
    product: ProductConfigure,
    selectedOptions: Record<string, string>,
    groupCode: string,
    optionCode: string,
  ): boolean {
    const nextSelectedOptions = {
      ...selectedOptions,
      [groupCode]: optionCode,
    };

    return this.getProductVariants(product).some(
      (variant) =>
        variant.stockQuantity > 0 &&
        this.variantMatches(variant, nextSelectedOptions),
    );
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

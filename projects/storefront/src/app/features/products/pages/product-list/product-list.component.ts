import { AsyncPipe, getCurrencySymbol } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@orange/core/auth';
import { Category } from '@orange/core/models';
import { Product, ProductSort } from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { AnalyticsService } from '@orange/core/services';
import { WishlistService } from 'src/app/features/profile/services/wishlist.service';
import { ProductCardComponent } from 'src/app/features/products/components/product-card/product-card.component';
import { ProductFacade } from 'src/app/features/products/store/products.facade';
import { ProductListToolbarComponent } from 'src/app/features/products/components/product-list-toolbar/product-list-toolbar.component';
import { RangeValue } from '@orange/ui/range-slider';
import { FilterDropdownOption } from '@orange/ui/filter-dropdown';
import {
  DIACRITICS_PATTERN,
  LEADING_OR_TRAILING_HYPHENS_PATTERN,
  NON_ALPHANUMERIC_PATTERN,
} from '@orange/shared/constants';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  Subject,
  withLatestFrom,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '@orange/ui/confirm-dialog';

@Component({
  selector: 'app-product-list',
  imports: [
    AsyncPipe,
    ProductCardComponent,
    ProductListToolbarComponent,
    TranslatePipe,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productFacade = inject(ProductFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly analytics = inject(AnalyticsService);
  private readonly authStore = inject(AuthStore);
  private readonly wishlistService = inject(WishlistService);
  readonly siteService = inject(SiteService);

  readonly products$ = this.productFacade.products$;
  readonly loading$ = this.productFacade.loadingProducts$;
  readonly error$ = this.productFacade.productsError$;
  readonly wishlistVm$ = combineLatest([
    this.wishlistService.productIds$,
    this.wishlistService.mutatingProductIds$,
  ]).pipe(
    map(([productIds, mutatingProductIds]) => ({
      productIds,
      mutatingProductIds,
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly selectedCategoryId$ = this.productFacade.selectedCategoryId$;
  readonly categoryOptions$ = this.productFacade.categories$.pipe(
    map(
      (categories): FilterDropdownOption<number>[] =>
        categories.map(({ id, name }) => ({ label: name, value: id })),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly search$ = this.productFacade.search$;

  readonly sortOptions: FilterDropdownOption<ProductSort>[] = [
    {
      label: 'Price: Low to High',
      value: 'price-asc',
    },
    {
      label: 'Price: High to Low',
      value: 'price-desc',
    },
    {
      label: 'Name: A to Z',
      value: 'name-asc',
    },
    {
      label: 'Name: Z to A',
      value: 'name-desc',
    },
  ];
  readonly selectedSort$ = this.productFacade.selectedSort$;

  readonly priceMax$ = combineLatest([
    this.productFacade.priceFilterMax$,
    this.productFacade.maxPrice$,
  ]).pipe(
    map(([priceFilterMax, selectedMaxPrice]) =>
      Math.max(priceFilterMax ?? 0, selectedMaxPrice ?? 0),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly priceRange$ = combineLatest([
    this.productFacade.minPrice$,
    this.productFacade.maxPrice$,
    this.priceMax$,
  ]).pipe(
    map(
      ([minPrice, maxPrice, priceMax]): RangeValue => ({
        min: minPrice ?? 0,
        max: maxPrice ?? priceMax,
      }),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly hasActiveProductFilters$ = combineLatest([
    this.search$,
    this.selectedCategoryId$,
    this.productFacade.minPrice$,
    this.productFacade.maxPrice$,
  ]).pipe(
    map(
      ([search, categoryId, minPrice, maxPrice]) =>
        search !== null ||
        categoryId !== null ||
        minPrice !== null ||
        maxPrice !== null,
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly pricePrefix = computed(() => {
    const currency = this.siteService.currency();

    return currency ? getCurrencySymbol(currency, 'narrow') : '';
  });

  private readonly categoryChange$ = new Subject<number | null>();
  private readonly priceRangeChange$ = new Subject<RangeValue>();

  ngOnInit(): void {
    this.initializeProductList();
    this.watchSearchRouteParam();
    this.watchCategoryRouteParam();
    this.watchWishlistSession();
    this.trackProductViews();

    this.categoryChange$
      .pipe(
        withLatestFrom(this.productFacade.categories$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([categoryId, categories]) => {
        const category = categories.find(({ id }) => id === categoryId);

        this.productFacade.selectCategory(categoryId);
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            category: this.normalizeCategorySlug(category?.name),
          },
          queryParamsHandling: 'merge',
        });
      });

    this.priceRangeChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => prev.min === curr.min && prev.max === curr.max,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((val) => {
        this.productFacade.setPriceFilter(val.min, val.max);
      });
  }

  private initializeProductList(): void {
    this.productFacade.loadCategories();
    this.productFacade.clearProductFilters();
  }

  private watchCategoryRouteParam(): void {
    combineLatest([
      this.route.queryParamMap.pipe(
        map((params) => this.normalizeCategorySlug(params.get('category'))),
        distinctUntilChanged(),
      ),
      this.productFacade.categories$,
    ])
      .pipe(
        filter(([, categories]) => categories.length > 0),
        map(([categorySlug, categories]) =>
          this.findCategoryId(categories, categorySlug),
        ),
        distinctUntilChanged(),
        withLatestFrom(this.selectedCategoryId$),
        filter(
          ([categoryId, selectedCategoryId]) =>
            categoryId !== selectedCategoryId,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([categoryId]) => {
        this.productFacade.selectCategory(categoryId);
      });
  }

  private watchSearchRouteParam(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => this.normalizeSearch(params.get('search'))),
        distinctUntilChanged(),
        withLatestFrom(this.search$),
        filter(([search, selectedSearch]) => search !== selectedSearch),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([search]) => {
        this.productFacade.selectSearch(search);
      });
  }

  onSortChange(sortBy: ProductSort | null): void {
    this.productFacade.selectSort(sortBy);
  }

  onCategoryChange(categoryId: number | null): void {
    this.categoryChange$.next(categoryId);
  }

  onApplyPriceFilter(value: RangeValue): void {
    this.priceRangeChange$.next(value);
  }

  onClearFilters(): void {
    this.productFacade.clearProductFilters();
    this.clearCategoryQueryParam();
  }

  configureProduct(product: Product): void {
    const site = this.siteService.currentSite();

    this.router.navigate(['/', site, 'products', product.id, 'configure']);
  }

  viewProductDetail(product: Product): void {
    const site = this.siteService.currentSite();

    this.router.navigate(['/', site, 'products', product.id]);
  }

  toggleWishlist(product: Product, isWishlisted: boolean): void {
    if (!this.authStore.isAuthenticated()) {
      this.promptForSignIn();
      return;
    }

    this.wishlistService.toggleProduct(product.id, isWishlisted);
  }

  private trackProductViews(): void {
    this.products$
      .pipe(
        filter((products) => products.length > 0),
        distinctUntilChanged(
          (previous, current) =>
            previous.map((product) => product.id).join(',') ===
            current.map((product) => product.id).join(','),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((products) => {
        this.analytics.trackProductViews(products);
      });
  }

  private watchWishlistSession(): void {
    this.authStore.isAuthenticated$
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.wishlistService.loadWishlist();
        } else {
          this.wishlistService.clear();
        }
      });
  }

  private promptForSignIn(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: {
        title: 'products.wishlistAuth.title',
        message: 'products.wishlistAuth.message',
        cancel: 'products.wishlistAuth.cancel',
        proceed: 'products.wishlistAuth.proceed',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => result === 'proceed'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.router.navigate(
          ['/', this.siteService.currentSite(), 'auth', 'login'],
          {
            queryParams: { returnUrl: this.router.url },
          },
        );
      });
  }

  private findCategoryId(
    categories: Category[],
    categorySlug: string | null,
  ): number | null {
    if (!categorySlug) {
      return null;
    }

    const category = categories.find((item) => {
      const itemSlug = this.normalizeCategorySlug(item.name);

      if (!itemSlug) {
        return false;
      }

      return (
        itemSlug === categorySlug ||
        itemSlug.endsWith(`-${categorySlug}`) ||
        categorySlug.endsWith(`-${itemSlug}`)
      );
    });

    return category?.id ?? null;
  }

  private normalizeCategorySlug(
    category: string | null | undefined,
  ): string | null {
    const slug = category
      ?.normalize('NFD')
      .replace(DIACRITICS_PATTERN, '')
      .trim()
      .toLowerCase()
      .replace(NON_ALPHANUMERIC_PATTERN, '-')
      .replace(LEADING_OR_TRAILING_HYPHENS_PATTERN, '');

    return slug || null;
  }

  private normalizeSearch(search: string | null | undefined): string | null {
    return search?.trim() || null;
  }

  private clearCategoryQueryParam(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, search: null },
      queryParamsHandling: 'merge',
    });
  }
}

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SiteService } from '@orange/core/services';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { ProductApiService } from 'src/app/features/products/services/product-api.service';

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit {
  private readonly productApi = inject(ProductApiService);
  private readonly router = inject(Router);
  private readonly siteService = inject(SiteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly suggestions = signal<string[]>([]);
  readonly suggestionsOpen = signal(false);
  readonly activeSuggestionIndex = signal(-1);

  ngOnInit(): void {
    this.watchSearchTerm();
    this.syncSearchFromUrl();
  }

  submit(): void {
    this.search(this.searchControl.value);
  }

  selectSuggestion(suggestion: string): void {
    this.searchControl.setValue(suggestion, { emitEvent: false });
    this.search(suggestion);
  }

  onFocus(): void {
    if (this.suggestions().length > 0) {
      this.suggestionsOpen.set(true);
    }
  }

  onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;

    if (
      !(nextTarget instanceof Node) ||
      !this.elementRef.nativeElement.contains(nextTarget)
    ) {
      this.closeSuggestions();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const suggestions = this.suggestions();

    if (event.key === 'Escape') {
      this.closeSuggestions();
      return;
    }

    if (suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.suggestionsOpen.set(true);
      this.activeSuggestionIndex.update((index) =>
        Math.min(index + 1, suggestions.length - 1),
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex.update((index) => Math.max(index - 1, -1));
    } else if (event.key === 'Enter') {
      const activeSuggestion = suggestions[this.activeSuggestionIndex()];

      if (activeSuggestion) {
        event.preventDefault();
        this.selectSuggestion(activeSuggestion);
      }
    }
  }

  private watchSearchTerm(): void {
    this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) =>
          query
            ? this.productApi
                .getSearchSuggestions(query)
                .pipe(catchError(() => of([])))
            : of([]),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((suggestions) => {
        this.suggestions.set(suggestions.slice(0, 5));
        this.suggestionsOpen.set(suggestions.length > 0);
        this.activeSuggestionIndex.set(-1);
      });
  }

  private syncSearchFromUrl(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        map(() => {
          const search = this.router.parseUrl(this.router.url).queryParams[
            'search'
          ];

          return typeof search === 'string' ? search : '';
        }),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => {
        if (search !== this.searchControl.value) {
          this.searchControl.setValue(search, { emitEvent: false });
        }
      });
  }

  private search(value: string): void {
    const search = value.trim();

    this.closeSuggestions();
    void this.router.navigate(
      ['/', this.siteService.currentSite(), 'products'],
      {
        queryParams: search ? { search } : {},
      },
    );
  }

  private closeSuggestions(): void {
    this.suggestionsOpen.set(false);
    this.activeSuggestionIndex.set(-1);
  }
}

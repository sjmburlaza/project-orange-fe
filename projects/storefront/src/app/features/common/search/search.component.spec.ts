import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SiteService } from '@orange/core/services';
import { of } from 'rxjs';
import { ProductApiService } from 'src/app/features/products/services/product-api.service';

import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let productApi: { getSearchSuggestions: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    productApi = {
      getSearchSuggestions: vi.fn(() => of(['wireless mouse', 'gaming mouse'])),
    };

    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        provideTranslateService(),
        {
          provide: ProductApiService,
          useValue: productApi,
        },
        {
          provide: SiteService,
          useValue: { currentSite: () => 'ph' },
        },
        {
          provide: Router,
          useValue: {
            url: '/ph/products',
            events: of(),
            parseUrl: () => ({ queryParams: {} }),
            navigate: vi.fn(() => Promise.resolve(true)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('loads debounced suggestions for a non-empty query', async () => {
    component.searchControl.setValue(' mouse ');
    await new Promise((resolve) => setTimeout(resolve, 275));

    expect(productApi.getSearchSuggestions).toHaveBeenCalledWith('mouse');
    expect(component.suggestions()).toEqual([
      'wireless mouse',
      'gaming mouse',
    ]);
    expect(component.suggestionsOpen()).toBe(true);
  });

  it('navigates to the site product list with the submitted search', () => {
    component.searchControl.setValue(' keyboard ', { emitEvent: false });

    component.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/', 'ph', 'products'], {
      queryParams: { search: 'keyboard' },
    });
  });

  it('uses a selected suggestion as the product search', () => {
    component.selectSuggestion('wireless mouse');

    expect(component.searchControl.value).toBe('wireless mouse');
    expect(router.navigate).toHaveBeenCalledWith(['/', 'ph', 'products'], {
      queryParams: { search: 'wireless mouse' },
    });
  });
});

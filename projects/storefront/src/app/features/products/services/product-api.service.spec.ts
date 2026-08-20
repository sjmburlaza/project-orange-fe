import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProductApiService } from './product-api.service';

describe('ProductApiService', () => {
  let service: ProductApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('passes search to the ranked product endpoint', () => {
    service.getProducts({ search: 'keyboard' }).subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/products' &&
        candidate.params.get('search') === 'keyboard',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('loads search suggestions for the query', () => {
    const suggestions = ['wireless mouse', 'gaming mouse'];

    service.getSearchSuggestions('mouse').subscribe((response) => {
      expect(response).toEqual(suggestions);
    });

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/products/search/suggestions' &&
        candidate.params.get('query') === 'mouse',
    );

    expect(request.request.method).toBe('GET');
    request.flush(suggestions);
  });

  it('passes category, sorting, and price filters to the products endpoint', () => {
    service
      .getProducts({
        categoryId: 3,
        sortBy: 'price-desc',
        minPrice: 1000,
        maxPrice: 50000,
      })
      .subscribe();

    const request = http.expectOne((candidate) => {
      return (
        candidate.url === '/api/products' &&
        candidate.params.get('categoryId') === '3' &&
        candidate.params.get('sortBy') === 'price-desc' &&
        candidate.params.get('minPrice') === '1000' &&
        candidate.params.get('maxPrice') === '50000'
      );
    });

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('loads product configuration, options, addons, and plans', () => {
    service.getProductConfigure(42).subscribe();
    http.expectOne('/api/products/42').flush({});

    service
      .getProductOptions(42, { color: 'blue', storage: '', size: 'large' })
      .subscribe();
    const optionsRequest = http.expectOne((candidate) => {
      return (
        candidate.url === '/api/products/42/options' &&
        candidate.params.get('color') === 'blue' &&
        candidate.params.get('size') === 'large' &&
        !candidate.params.has('storage')
      );
    });
    optionsRequest.flush({ selectedOptions: {}, optionGroups: [] });

    service.getProductAddons(42).subscribe();
    http.expectOne('/api/products/42/addons').flush([]);

    service.getProductInsurancePlans(42).subscribe();
    http.expectOne('/api/products/42/insurance-plans').flush([]);

    service.getProductMobilePlans(42).subscribe();
    http.expectOne('/api/products/42/mobile-plans').flush([]);
  });
});

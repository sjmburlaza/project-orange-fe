import { DOCUMENT } from '@angular/common';
import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SiteService } from '@orange/core/services';
import { ApiSitePrefixInterceptor } from './api-site-prefix.interceptor';

describe('ApiSitePrefixInterceptor', () => {
  let interceptor: ApiSitePrefixInterceptor;
  let fallbackSite = 'ph';
  let documentStub: Document;
  let handledUrl: string | null;
  const supportedSites = new Set(['ph', 'fr', 'cn', 'jp']);

  const handler: HttpHandler = {
    handle: (request: HttpRequest<unknown>) => {
      handledUrl = request.url;
      return of(new HttpResponse({ status: 200 }));
    },
  };

  beforeEach(() => {
    documentStub = {
      location: {
        pathname: '/fr/products',
      },
    } as unknown as Document;

    TestBed.configureTestingModule({
      providers: [
        ApiSitePrefixInterceptor,
        {
          provide: DOCUMENT,
          useValue: documentStub,
        },
        {
          provide: SiteService,
          useValue: {
            getCurrentSite: () => fallbackSite,
            isSupportedSite: (site: string | null | undefined) =>
              Boolean(site && supportedSites.has(site)),
          },
        },
      ],
    });

    interceptor = TestBed.inject(ApiSitePrefixInterceptor);
    fallbackSite = 'ph';
    handledUrl = null;
  });

  it('adds the active route site code after the API prefix', () => {
    interceptor.intercept(new HttpRequest('GET', '/api/products'), handler).subscribe();

    expect(handledUrl).toBe('/api/fr/products');
  });

  it('falls back to the current site service value when the URL has no site segment', () => {
    documentStub.location.pathname = '/';
    fallbackSite = 'jp';

    interceptor
      .intercept(new HttpRequest('POST', '/api/auth/login', null), handler)
      .subscribe();

    expect(handledUrl).toBe('/api/jp/auth/login');
  });

  it('does not add the site code again when the API URL is already site-prefixed', () => {
    interceptor
      .intercept(new HttpRequest('GET', '/api/cn/categories'), handler)
      .subscribe();

    expect(handledUrl).toBe('/api/cn/categories');
  });

  it('leaves country detection unscoped because it resolves the site', () => {
    interceptor
      .intercept(new HttpRequest('GET', '/api/geo/country'), handler)
      .subscribe();

    expect(handledUrl).toBe('/api/geo/country');
  });

  it('leaves site config requests unscoped because they resolve the site', () => {
    interceptor
      .intercept(new HttpRequest('GET', '/api/sites/fr'), handler)
      .subscribe();

    expect(handledUrl).toBe('/api/sites/fr');
  });

  it('leaves non-API URLs unchanged', () => {
    interceptor
      .intercept(new HttpRequest('GET', '/assets/i18n/en/common.json'), handler)
      .subscribe();

    expect(handledUrl).toBe('/assets/i18n/en/common.json');
  });
});

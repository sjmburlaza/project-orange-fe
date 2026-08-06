import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SiteConfig } from '@orange/core/i18n';
import { SiteService } from './site.services';

const phSite: SiteConfig = {
  code: 'ph',
  countryName: 'Philippines',
  locale: 'en-PH',
  currency: 'PHP',
  defaultLanguage: 'en',
  supportedLanguages: ['en'],
  features: {
    insurance: true,
    tradeIn: false,
    vouchers: true,
  },
};

const frSite: SiteConfig = {
  code: 'fr',
  countryName: 'France',
  locale: 'fr-FR',
  currency: 'EUR',
  defaultLanguage: 'fr',
  supportedLanguages: ['fr'],
  features: {
    insurance: true,
    tradeIn: true,
    vouchers: true,
  },
};

describe('SiteService', () => {
  let service: SiteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SiteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads site options and config from the sites list endpoint', () => {
    service.loadSites().subscribe();

    http.expectOne('/api/sites').flush({ sites: [phSite, frSite] });

    expect(service.isSupportedSite('ph')).toBe(true);
    expect(service.getCurrentSite()).toBe('ph');
    expect(service.currency()).toBe('PHP');
    expect(service.getSiteOptions()).toEqual([
      {
        code: 'ph',
        countryName: 'Philippines',
        flagCode: 'ph',
      },
      {
        code: 'fr',
        countryName: 'France',
        flagCode: 'fr',
      },
    ]);
  });

  it('accepts a wrapped site response', () => {
    service.loadSite('FR').subscribe();

    http.expectOne('/api/sites/fr').flush({ site: frSite });

    expect(service.isSupportedSite('fr')).toBe(true);
    expect(service.getCurrentSite()).toBe('fr');
    expect(service.isFeatureEnabled('tradeIn')).toBe(true);
  });
});

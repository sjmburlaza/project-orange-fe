import {
  inject,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  PLATFORM_ID,
  provideAppInitializer,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
  withXsrfConfiguration,
} from '@angular/common/http';
import { ApiSitePrefixInterceptor } from '@orange/core/interceptors';
import { AuthInterceptor } from '@orange/core/interceptors';
import { MockAuthInterceptor } from '@orange/core/interceptors';
import { MockPaymentInterceptor } from '@orange/core/interceptors';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { MultiTranslateLoader } from '@orange/core/i18n';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { productFeature } from 'src/app/features/products/store/products.reducer';
import { ProductEffects } from 'src/app/features/products/store/products.effects';
import { cartFeature } from './features/cart/store/cart.reducer';
import { CartEffects } from './features/cart/store/cart.effects';
import { tradeInFeature } from './features/trade-in/store/trade-in.reducer';
import { TradeInEffects } from './features/trade-in/store/trade-in.effects';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SiteService } from '@orange/core/services';
import { normalizeSiteCode, SiteConfig } from '@orange/core/i18n';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js';
import { provideCharts } from 'ng2-charts';

const mockInterceptors = environment.useMockAuth
  ? [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MockAuthInterceptor,
        multi: true,
      },
    ]
  : [];

const mockPaymentInterceptors = environment.useMockPayments
  ? [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MockPaymentInterceptor,
        multi: true,
      },
    ]
  : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptorsFromDi(),
    ),
    provideAppInitializer(() => {
      const platformId = inject(PLATFORM_ID);

      if (!isPlatformBrowser(platformId)) {
        return;
      }

      const authService = inject(AuthService);
      const authStore = inject(AuthStore);
      const siteService = inject(SiteService);
      const document = inject(DOCUMENT);
      const initialSite = getSiteFromPath(document.location.pathname);

      return firstValueFrom(
        loadInitialSite(siteService, initialSite).pipe(
          switchMap(() =>
            authService.getSession().pipe(
              tap((session) => authStore.setSession(session)),
              catchError(() => {
                authStore.clearSession();
                return of(null);
              }),
            ),
          ),
        ),
      );
    }),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useClass: MultiTranslateLoader,
      },
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiSitePrefixInterceptor,
      multi: true,
    },
    ...mockInterceptors,
    ...mockPaymentInterceptors,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideStore({
      [productFeature.name]: productFeature.reducer,
      [cartFeature.name]: cartFeature.reducer,
      [tradeInFeature.name]: tradeInFeature.reducer,
    }),
    provideEffects([ProductEffects, CartEffects, TradeInEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideCharts({
      registerables: [
        ArcElement,
        BarController,
        BarElement,
        CategoryScale,
        Filler,
        Legend,
        LinearScale,
        LineController,
        LineElement,
        PieController,
        PointElement,
        Tooltip,
      ],
    }),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
  ],
};

function getSiteFromPath(pathname: string): string | null {
  const [site] = pathname.split('/').filter(Boolean);
  return normalizeSiteCode(site);
}

function loadInitialSite(
  siteService: SiteService,
  site: string | null,
) {
  if (!site) {
    return siteService.loadSites().pipe(catchError(() => of([])));
  }

  return siteService.loadSite(site).pipe(
    map((config): SiteConfig[] => (config ? [config] : [])),
    catchError(() => of([])),
  );
}

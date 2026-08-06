import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withXsrfConfiguration,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  AUTH_GUARD_REDIRECTS,
  AuthGuardRedirects,
} from '@orange/core/guards';

import { routes } from './app.routes';

const adminAuthGuardRedirects: AuthGuardRedirects = {
  loginUrlTree: (router, returnUrl) =>
    router.createUrlTree(['/admin/login'], {
      queryParams: { returnUrl },
    }),
  unauthorizedUrlTree: (router, returnUrl) =>
    router.createUrlTree(['/admin/login'], {
      queryParams: { returnUrl },
    }),
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: AUTH_GUARD_REDIRECTS, useValue: adminAuthGuardRedirects },
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
    provideAnimations(),
  ],
};

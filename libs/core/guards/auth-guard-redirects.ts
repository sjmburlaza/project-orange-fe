import { inject, InjectionToken } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { SiteService } from '@orange/core/services';

export interface AuthGuardRedirects {
  loginUrlTree(router: Router, returnUrl: string): UrlTree;
  unauthorizedUrlTree(router: Router, returnUrl: string): UrlTree;
}

export const AUTH_GUARD_REDIRECTS = new InjectionToken<AuthGuardRedirects>(
  'AUTH_GUARD_REDIRECTS',
  {
    providedIn: 'root',
    factory: () => {
      const siteService = inject(SiteService);

      return {
        loginUrlTree: (router, returnUrl) =>
          router.createUrlTree(
            [`/${siteService.getCurrentSite()}/auth/login`],
            {
              queryParams: { returnUrl },
            },
          ),
        unauthorizedUrlTree: (router) =>
          router.createUrlTree([`/${siteService.getCurrentSite()}/products`]),
      };
    },
  },
);

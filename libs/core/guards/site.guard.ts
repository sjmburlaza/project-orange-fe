import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, of } from 'rxjs';
import { normalizeSiteCode, SiteConfig } from '@orange/core/i18n';
import { SiteService } from '@orange/core/services';

export const siteGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const translate = inject(TranslateService);
  const siteService = inject(SiteService);

  const site = normalizeSiteCode(route.paramMap.get('site'));
  const countrySelector = router.createUrlTree(['/']);

  if (!site) {
    return countrySelector;
  }

  const loadedConfig = siteService.getSiteConfig(site);

  if (loadedConfig) {
    activateSite(loadedConfig, translate, siteService);
    return true;
  }

  return siteService.loadSite(site).pipe(
    map((config) => {
      if (!config) {
        return countrySelector;
      }

      activateSite(config, translate, siteService);
      return true;
    }),
    catchError(() => of(countrySelector)),
  );
};

function activateSite(
  config: SiteConfig,
  translate: TranslateService,
  siteService: SiteService,
): void {
  translate.use(config.defaultLanguage);
  siteService.setCurrentSite(config.code);
}

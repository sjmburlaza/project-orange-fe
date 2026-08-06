import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SiteCode } from '@orange/core/i18n';
import { SiteService } from '@orange/core/services';

@Injectable()
export class ApiSitePrefixInterceptor implements HttpInterceptor {
  private readonly siteService = inject(SiteService);
  private readonly document = inject(DOCUMENT);
  private readonly apiPrefix = '/api/';
  private readonly unscopedApiPathPrefixes = new Set([
    'geo',
    'payments',
    'sites',
  ]);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(this.apiPrefix)) {
      return next.handle(req);
    }

    const apiPath = req.url.slice(this.apiPrefix.length);

    if (this.isUnscopedApiPath(apiPath) || this.hasSitePrefix(apiPath)) {
      return next.handle(req);
    }

    const site = this.getActiveSite();

    if (!site) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        url: `${this.apiPrefix}${site}/${apiPath}`,
      }),
    );
  }

  private getActiveSite(): SiteCode | null {
    return this.getSiteFromCurrentPath() ?? this.siteService.getCurrentSite();
  }

  private getSiteFromCurrentPath(): SiteCode | null {
    const [site] = this.document.location?.pathname
      ?.split('/')
      .filter(Boolean) ?? [null];

    return this.siteService.isSupportedSite(site) ? site : null;
  }

  private hasSitePrefix(apiPath: string): boolean {
    const [site] = apiPath.split('/');
    return this.siteService.isSupportedSite(site);
  }

  private isUnscopedApiPath(apiPath: string): boolean {
    const [pathWithoutQuery] = apiPath.split('?');
    const [prefix] = pathWithoutQuery.split('/');
    return this.unscopedApiPathPrefixes.has(prefix);
  }
}

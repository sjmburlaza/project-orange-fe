import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthStore } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly siteService = inject(SiteService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const authReq = this.isApiUrl(req.url)
      ? req.clone({ withCredentials: true })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authStore.clearSession();

          if (!this.isAuthEndpoint(authReq.url)) {
            const site = this.siteService.getCurrentSite();
            void this.router.navigate([site ? `/${site}/auth/login` : '/']);
          }
        }

        return throwError(() => error);
      }),
    );
  }

  private isAuthEndpoint(url: string): boolean {
    return this.getApiPath(url)?.startsWith('/auth/') ?? false;
  }

  private isApiUrl(url: string): boolean {
    return this.getApiPath(url) !== null;
  }

  private getApiPath(url: string): string | null {
    if (url.startsWith('/api/')) {
      const segments = url.slice('/api/'.length).split('/');

      return this.siteService.isSupportedSite(segments[0])
        ? `/${segments.slice(1).join('/')}`
        : `/${segments.join('/')}`;
    }

    return null;
  }
}

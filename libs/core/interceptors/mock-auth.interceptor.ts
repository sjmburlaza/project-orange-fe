import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { PERMISSIONS, ROLES } from '@orange/core/models';
import {
  AuthSession,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  User,
} from '@orange/core/models';
import { SiteService } from '@orange/core/services';

@Injectable()
export class MockAuthInterceptor implements HttpInterceptor {
  private readonly siteService = inject(SiteService);
  private readonly mockResetToken = 'local-reset-token';
  private readonly mockUser: User = {
    id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
    email: 'admin@example.com',
    fullName: 'Sample Admin',
    roles: [ROLES.ADMIN],
    permissions: [
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.ORDERS_CANCEL,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.USERS_READ,
    ],
  };

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const apiPath = this.getApiPath(req.url);

    if (apiPath === '/geo/country' && req.method === 'GET') {
      return of(
        new HttpResponse({
          status: 200,
          body: { code: 'ph' },
        }),
      ).pipe(delay(100));
    }

    if (apiPath === '/auth/login' && req.method === 'POST') {
      const body = req.body as Partial<LoginDto> | null;

      return of(
        new HttpResponse({
          status: 200,
          body: this.createMockSession(body?.email),
        }),
      ).pipe(delay(800));
    }

    if (apiPath === '/auth/register' && req.method === 'POST') {
      return of(
        new HttpResponse({
          status: 201,
        }),
      ).pipe(delay(800));
    }

    if (apiPath === '/auth/forgot-password' && req.method === 'POST') {
      const body = req.body as Partial<ForgotPasswordDto> | null;
      const email = body?.email ?? this.mockUser.email;
      const site = this.siteService.getCurrentSite() || 'ph';
      const resetUrl = `/${site}/auth/reset-password?email=${encodeURIComponent(
        email,
      )}&token=${encodeURIComponent(this.mockResetToken)}`;

      return of(
        new HttpResponse({
          status: 200,
          body: {
            message:
              'If an account exists for that email, password reset instructions will be sent.',
            resetToken: this.mockResetToken,
            resetUrl,
          },
        }),
      ).pipe(delay(800));
    }

    if (apiPath === '/auth/reset-password' && req.method === 'POST') {
      const body = req.body as Partial<ResetPasswordDto> | null;

      if (!body?.email || body.token !== this.mockResetToken) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { code: 'RESET_TOKEN_INVALID' },
            }),
        ).pipe(delay(500));
      }

      return of(
        new HttpResponse({
          status: 204,
        }),
      ).pipe(delay(800));
    }

    if (apiPath === '/auth/session' && req.method === 'GET') {
      return of(
        new HttpResponse({
          status: 200,
          body: this.createMockSession(),
        }),
      ).pipe(delay(300));
    }

    if (apiPath === '/auth/logout' && req.method === 'POST') {
      return of(
        new HttpResponse({
          status: 204,
        }),
      ).pipe(delay(300));
    }

    return next.handle(req);
  }

  private getApiPath(url: string): string | null {
    if (!url.startsWith('/api/')) {
      return null;
    }

    const segments = url.slice('/api/'.length).split('/');

    return this.siteService.isSupportedSite(segments[0])
      ? `/${segments.slice(1).join('/')}`
      : `/${segments.join('/')}`;
  }

  private createMockSession(email = this.mockUser.email): AuthSession {
    return {
      user: {
        ...this.mockUser,
        email,
      },
      session: {
        id: 'f48e7a9fc19d4a73b48d4e0720415073',
        createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
        expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
      },
    };
  }
}

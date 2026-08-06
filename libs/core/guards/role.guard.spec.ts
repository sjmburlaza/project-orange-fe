import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { ROLES } from '@orange/core/models';
import { AuthSession } from '@orange/core/models';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';

import { AUTH_GUARD_REDIRECTS, AuthGuardRedirects } from './auth-guard-redirects';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let router: Router;
  let authService: { getSession: ReturnType<typeof vi.fn> };
  let authStore: {
    getSessionSnapshot: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
    hasAnyRole: ReturnType<typeof vi.fn>;
    hasAllPermissions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = { getSession: vi.fn() };
    authStore = {
      getSessionSnapshot: vi.fn(),
      setSession: vi.fn(),
      clearSession: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllPermissions: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authService },
        { provide: AuthStore, useValue: authStore },
        { provide: AUTH_GUARD_REDIRECTS, useValue: testRedirects },
        provideRouter([]),
      ],
    });

    guard = TestBed.inject(RoleGuard);
    router = TestBed.inject(Router);
  });

  it('allows access when the session has the required role', () => {
    authStore.getSessionSnapshot.mockReturnValue(createSession());
    authStore.hasAnyRole.mockReturnValue(true);
    authStore.hasAllPermissions.mockReturnValue(true);

    const result = guard.canActivate(
      createRoute({ role: ROLES.ADMIN }),
      createState('/admin/products'),
    );

    expect(result).toBe(true);
  });

  it('redirects a missing session with the return URL', () => {
    authStore.getSessionSnapshot.mockReturnValue(null);

    const result = guard.canActivate(
      createRoute({ role: ROLES.ADMIN }),
      createState('/admin/products'),
    );

    expectSerializedUrl(result, '/login?returnUrl=%2Fadmin%2Fproducts');
  });

  it('uses the configured unauthorized redirect for insufficient roles', () => {
    authStore.getSessionSnapshot.mockReturnValue(createSession());
    authStore.hasAnyRole.mockReturnValue(false);
    authStore.hasAllPermissions.mockReturnValue(true);

    const result = guard.canActivate(
      createRoute({ role: ROLES.ADMIN }),
      createState('/admin/products'),
    );

    expectSerializedUrl(result, '/forbidden?returnUrl=%2Fadmin%2Fproducts');
  });

  it('loads an unknown session before checking access', async () => {
    const session = createSession();
    authStore.getSessionSnapshot.mockReturnValue(undefined);
    authService.getSession.mockReturnValue(of(session));
    authStore.hasAnyRole.mockReturnValue(true);
    authStore.hasAllPermissions.mockReturnValue(true);

    const result = await firstValueFrom(
      guard.canActivate(
        createRoute({ role: ROLES.ADMIN }),
        createState('/admin/products'),
      ) as Observable<boolean | UrlTree>,
    );

    expect(result).toBe(true);
    expect(authStore.setSession).toHaveBeenCalledWith(session);
  });

  it('clears and redirects when session loading fails', async () => {
    authStore.getSessionSnapshot.mockReturnValue(undefined);
    authService.getSession.mockReturnValue(
      throwError(() => new Error('Session expired')),
    );

    const result = await firstValueFrom(
      guard.canActivate(
        createRoute({ role: ROLES.ADMIN }),
        createState('/admin/products'),
      ) as Observable<boolean | UrlTree>,
    );

    expectSerializedUrl(result, '/login?returnUrl=%2Fadmin%2Fproducts');
    expect(authStore.clearSession).toHaveBeenCalled();
  });

  function createRoute(data: Record<string, unknown>): ActivatedRouteSnapshot {
    return { data } as ActivatedRouteSnapshot;
  }

  function createState(url: string): RouterStateSnapshot {
    return { url } as RouterStateSnapshot;
  }

  function expectSerializedUrl(result: unknown, expectedUrl: string): void {
    expect(router.serializeUrl(result as UrlTree)).toBe(expectedUrl);
  }
});

const testRedirects: AuthGuardRedirects = {
  loginUrlTree: (router, returnUrl) =>
    router.createUrlTree(['/login'], {
      queryParams: { returnUrl },
    }),
  unauthorizedUrlTree: (router, returnUrl) =>
    router.createUrlTree(['/forbidden'], {
      queryParams: { returnUrl },
    }),
};

function createSession(): AuthSession {
  return {
    user: {
      id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
      email: 'admin@example.com',
      fullName: 'Sample Admin',
      roles: [ROLES.ADMIN],
      permissions: [],
    },
    session: {
      id: 'f48e7a9fc19d4a73b48d4e0720415073',
      createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
      expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
    },
  };
}

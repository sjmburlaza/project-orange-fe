import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { AuthSession } from '@orange/core/models';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';

import { AUTH_GUARD_REDIRECTS, AuthGuardRedirects } from './auth-guard-redirects';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let authService: { getSession: ReturnType<typeof vi.fn> };
  let authStore: {
    getSessionSnapshot: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = { getSession: vi.fn() };
    authStore = {
      getSessionSnapshot: vi.fn(),
      setSession: vi.fn(),
      clearSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: AuthStore, useValue: authStore },
        { provide: AUTH_GUARD_REDIRECTS, useValue: testRedirects },
        provideRouter([]),
      ],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('allows an existing session', () => {
    authStore.getSessionSnapshot.mockReturnValue(createSession());

    const result = guard.canActivate({} as never, { url: '/profile' } as never);

    expect(result).toBe(true);
    expect(authService.getSession).not.toHaveBeenCalled();
  });

  it('redirects a missing session with the return URL', () => {
    authStore.getSessionSnapshot.mockReturnValue(null);

    const result = guard.canActivate({} as never, { url: '/profile' } as never);

    expectSerializedUrl(result, '/login?returnUrl=%2Fprofile');
  });

  it('loads an unknown session before allowing access', async () => {
    const session = createSession();
    authStore.getSessionSnapshot.mockReturnValue(undefined);
    authService.getSession.mockReturnValue(of(session));

    const result = await firstValueFrom(
      guard.canActivate(
        {} as never,
        { url: '/profile' } as never,
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
        {} as never,
        { url: '/profile' } as never,
      ) as Observable<boolean | UrlTree>,
    );

    expectSerializedUrl(result, '/login?returnUrl=%2Fprofile');
    expect(authStore.clearSession).toHaveBeenCalled();
  });

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
      roles: [],
      permissions: [],
    },
    session: {
      id: 'f48e7a9fc19d4a73b48d4e0720415073',
      createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
      expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
    },
  };
}

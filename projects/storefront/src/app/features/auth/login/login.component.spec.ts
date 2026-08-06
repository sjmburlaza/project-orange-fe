import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ROLES, Role } from '@orange/core/models';
import { AuthSession } from '@orange/core/models';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: { login: ReturnType<typeof vi.fn> };
  let authStore: { setSession: ReturnType<typeof vi.fn> };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
    navigateByUrl: ReturnType<typeof vi.fn>;
  };
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    authService = { login: vi.fn() };
    authStore = { setSession: vi.fn() };
    router = { navigate: vi.fn(), navigateByUrl: vi.fn() };
    queryParams = {};

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
        { provide: SiteService, useValue: { currentSite: () => 'ph' } },
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps admin users in the storefront after login', () => {
    const session = createSession([ROLES.ADMIN]);
    authService.login.mockReturnValue(of(session));

    submitLoginForm();

    expect(authStore.setSession).toHaveBeenCalledWith(session);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/ph/products');
  });

  it('redirects non-admin users to the cart after login', () => {
    const session = createSession([ROLES.CUSTOMER]);
    authService.login.mockReturnValue(of(session));

    submitLoginForm();

    expect(authStore.setSession).toHaveBeenCalledWith(session);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/ph/cart');
  });

  it('redirects non-admin users to a safe return URL after login', () => {
    queryParams['returnUrl'] = '/ph/profile/wishlist';
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const session = createSession([ROLES.CUSTOMER]);
    authService.login.mockReturnValue(of(session));

    submitLoginForm();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/ph/profile/wishlist');
  });

  function submitLoginForm(): void {
    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'password',
    });
    component.onSubmit();
  }
});

function createSession(roles: Role[]): AuthSession {
  return {
    user: {
      id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
      email: 'user@example.com',
      fullName: 'Sample User',
      roles,
      permissions: [],
    },
    session: {
      id: 'f48e7a9fc19d4a73b48d4e0720415073',
      createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
      expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
    },
  };
}

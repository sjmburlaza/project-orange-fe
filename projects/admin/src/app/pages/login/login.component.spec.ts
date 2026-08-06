import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ROLES, Role } from '@orange/core/models';
import { AuthSession } from '@orange/core/models';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: { login: ReturnType<typeof vi.fn> };
  let authStore: {
    clearSession: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    authService = { login: vi.fn() };
    authStore = {
      clearSession: vi.fn(),
      setSession: vi.fn(),
    };
    router = { navigateByUrl: vi.fn() };
    queryParams = {};

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
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

  it('signs in admin users to the analytics dashboard', () => {
    const session = createSession([ROLES.ADMIN]);
    authService.login.mockReturnValue(of(session));

    submitLoginForm();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password',
    });
    expect(authStore.setSession).toHaveBeenCalledWith(session);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/analytics');
  });

  it('uses a safe admin return URL after login', () => {
    queryParams['returnUrl'] = '/admin/orders';
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    authService.login.mockReturnValue(of(createSession([ROLES.ADMIN])));

    submitLoginForm();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/orders');
  });

  it('ignores return URLs outside the admin route prefix', () => {
    queryParams['returnUrl'] = '/orders';
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    authService.login.mockReturnValue(of(createSession([ROLES.ADMIN])));

    submitLoginForm();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/analytics');
  });

  it('rejects non-admin accounts', () => {
    authService.login.mockReturnValue(of(createSession([ROLES.CUSTOMER])));

    submitLoginForm();

    expect(authStore.clearSession).toHaveBeenCalled();
    expect(authStore.setSession).not.toHaveBeenCalled();
    expect(component.loginForm.hasError('unauthorized')).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  function submitLoginForm(): void {
    component.loginForm.setValue({
      email: 'admin@example.com',
      password: 'password',
    });
    component.onSubmit();
  }
});

function createSession(roles: Role[]): AuthSession {
  return {
    user: {
      id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
      email: 'admin@example.com',
      fullName: 'Sample Admin',
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

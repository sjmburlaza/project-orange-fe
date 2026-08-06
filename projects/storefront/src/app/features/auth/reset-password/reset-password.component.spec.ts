import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: { resetPassword: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { resetPassword: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: SiteService, useValue: { currentSite: () => 'ph' } },
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                email: 'juan@example.com',
                token: 'reset-token',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prefills email and token from query params', () => {
    expect(component.resetPasswordForm.controls.email.value).toBe(
      'juan@example.com',
    );
    expect(component.resetPasswordForm.controls.token.value).toBe('reset-token');
  });

  it('submits the reset password payload', () => {
    authService.resetPassword.mockReturnValue(of(undefined));

    component.resetPasswordForm.setValue({
      email: 'juan@example.com',
      token: 'reset-token',
      newPassword: 'NewPassw0rd!',
    });
    component.onSubmit();

    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'juan@example.com',
      token: 'reset-token',
      newPassword: 'NewPassw0rd!',
    });
    expect(component.isComplete).toBe(true);
  });

  it('navigates back to forgot password when requesting a new link', () => {
    component.goToForgotPassword();

    expect(router.navigate).toHaveBeenCalledWith(['/ph/auth/forgot-password']);
  });
});

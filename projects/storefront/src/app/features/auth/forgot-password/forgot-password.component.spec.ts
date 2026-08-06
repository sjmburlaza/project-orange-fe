import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: { requestPasswordReset: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { requestPasswordReset: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: SiteService, useValue: { currentSite: () => 'ph' } },
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits a generic password reset request', () => {
    authService.requestPasswordReset.mockReturnValue(
      of({
        resetToken: 'reset-token',
        resetUrl: '/ph/auth/reset-password?token=reset-token',
      }),
    );

    component.forgotPasswordForm.setValue({ email: 'juan@example.com' });
    component.onSubmit();

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'juan@example.com',
    });
    expect(component.isSubmitted).toBe(true);
    expect(component.resetToken).toBe('reset-token');
    expect(component.resetUrl).toBe('/ph/auth/reset-password?token=reset-token');
  });

  it('navigates to reset password with development token details', () => {
    component.submittedEmail = 'juan@example.com';
    component.resetToken = 'reset-token';

    component.continueToResetPassword();

    expect(router.navigate).toHaveBeenCalledWith(['/ph/auth/reset-password'], {
      queryParams: {
        email: 'juan@example.com',
        token: 'reset-token',
      },
    });
  });
});
